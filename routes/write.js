module.exports = function(conn){
    const express = require('express');
    const router = express.Router();  //router하는 객체를 추출
    let multer = require("multer");
    let multerS3 = require('multer-s3');
    let moment  = require("moment");

    let AWS = require("aws-sdk");
    AWS.config.region = 'ap-northeast-2';
    let s3 = new AWS.S3({params: {Bucket:'luxuryboard'}});

    var imgname="";
    var brands_name="";
    var upload = multer({
    storage: multerS3({
        s3: s3,
        dirname: '/' + brands_name,
        bucket: "luxuryboard",
        cacheControl: 'max-age=31536000',
        acl: 'public-read-write',
        ContentType:'',
        key: function (req, file, cb) {
            //let extension = path.extname(file.originalname);
            imgname = file.originalname;
            //imgname = Date.now().toString() + file.originalname;
            //console.log("imgname: " + imgname);
            cb(null, imgname);
        },
        shouldTransform: function (req, file, cb) {
            cb(null, /^image/i.test(file.mimetype))
        },
        transforms: [{
              id: 'original',
              transform: function(req, file, cb) {
                //Perform desired transformations
                cb(null, sharp().resize(640, 640).jpg());
              }
        }]
      })
    });

    //board 게시판 이미지 및 글 저장
    router.post('/', upload.array("image"), function(req, res){
      let imgFile = req.files;
      let userid = req.body.userid;
      let name  = req.body.name;
      let subject = req.body.subject;
      let descript = req.body.descript;
      let boardforum = req.body.boardforum;
      let boardtype = req.body.boardtype;

      //자바스크립트 날짜 시간 set
      let reg_date = moment().format("YYYY-MM-DD");
      let reg_hour = moment().hours();
      let reg_minute = moment().minute();
      let reg_time = reg_hour.toString() + ":"+reg_minute.toString();

      console.log("데이터를 확인", userid, name, subject, descript, boardforum, boardtype,reg_date, reg_time);
      //imagurl에 대한 max값 set
      const sql_idx = `select max(board_idx) idx from luxury.board`;
      conn.query(sql_idx, function(err, data){
        if(err){
          console.log(err);
          throw err;
        }
        else{
          let idx = data[0].idx + 1;
          const sql = `Insert into luxury.board(board_idx,userid,name,subject,descript,boardtype,boardforum,reg_date,reg_time)
                       values (?,?,?,?,?,?,?,?,?)`
          conn.query(sql,[idx,userid,name, subject, descript, boardtype,boardforum,reg_date,reg_time], function(err, data){
            //id는 랜덤으로 생성
            if(err){
              console.log(err);
              throw err;
            }
            else {
              //image insert 갯수에 따라 set
              if(imgFile.length == 0){
                res.json(data)
              }
              else{
                const sql_img = `Insert into luxury.boardimg (idx, seq, userid, imgurl, reg_dttm) values ?`;
                let reg_dttm = reg_date + " " + reg_time;
                let values = [];

                for(let i = 0; i < imgFile.length; i++) {
                  let imgValues = [];
                  imgValues.push(idx)
                  imgValues.push(i)
                  imgValues.push(userid)
                  imgValues.push(imgFile[i].location)
                  imgValues.push(reg_dttm)

                  values.push(imgValues)
                }
                //console.log(imgValues);
                conn.query(sql_img, [values], function(err,data){
                  if(err){
                    console.log(err);
                    throw err;
                  }
                  else{
                    res.json(200);
                  }
                })
              }
            }
          });
        }
      })

    });

    return router;
}
