module.exports = function(conn){
    const express = require('express');
    const router = express.Router();  //router하는 객체를 추출
    let multer = require("multer");
    let multerS3 = require('multer-s3');
    let moment  = require("moment");

    let AWS = require("aws-sdk");
    AWS.config.region = 'ap-northeast-2';
    let s3 = new AWS.S3({params: {Bucket:'luxuryboard'}});

    let validate = require('../module/validate');

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


    //board 게시판 리스트 조회
    router.get('/list/:boardtype/:page', function(req, res){
      let boardtype = req.params.boardtype;
      var page = req.params.page;
      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      var range = 0;
      let sql = '';
      //브랜드 포럼
      if(boardtype < 2){
         sql = `select b.board_idx, b.userid, b.name, b.subject, b.descript, b.boardtype, b.boardforum, b.views,
              							b.reg_date, b.reg_time, b.upd_date, b.upd_time, b.forum, b.comment
              		 from
                     (
            						select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
            								a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.forum, a.comment
            						from (
              							select a.board_idx, userid, name, subject, a.descript, boardtype, boardforum, views,
              								  reg_date, reg_time, upd_date, upd_time, b.descript forum, c.comment + d.comment comment
              							from luxury.board a, luxury.code b, (select b.board_idx board_idx, count(a.board_idx) comment
              																						from luxury.board b left outer join luxury.comment a
              																						on  b.board_idx = a.board_idx
              																						where b.boardtype = ?
              																						group by b.board_idx) c,
              								 (select b.board_idx board_idx, count(a.board_idx) comment
      												 from luxury.board b left outer join luxury.commentdown a
      												 on  b.board_idx = a.board_idx
      												 where b.boardtype = ?
      												 group by b.board_idx) d
              							where a.boardtype = ?
              							and a.boardforum = b.minor_key
              							and a.board_idx = c.board_idx
              							and a.board_idx = d.board_idx
              							and b.major_key = a.boardtype
              							order by a.board_idx desc
          						  ) a
          						  where (@rownum:=0)=0
                      ) b
                      where b.num > ? and b.num <= ?
                      `;
      }
      else{
        sql = `select b.board_idx, b.userid, b.name, b.subject, b.descript, b.boardtype, b.boardforum, b.views,
              							b.reg_date, b.reg_time, b.upd_date, b.upd_time, b.comment
              		 from
                     (
            						select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
            								a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.comment
            						from (
              							select a.board_idx, userid, name, subject, a.descript, boardtype, boardforum, views,
              								  reg_date, reg_time, upd_date, upd_time, c.comment
              							from luxury.board a, (select b.board_idx board_idx, count(a.board_idx) comment
              																						from luxury.board b left outer join luxury.comment a
              																						on  b.board_idx = a.board_idx
              																						where b.boardtype = ?
              																						group by b.board_idx) c,
              								 (select b.board_idx board_idx, count(a.board_idx) comment
      												 from luxury.board b left outer join luxury.commentdown a
      												 on  b.board_idx = a.board_idx
      												 where b.boardtype = ?
      												 group by b.board_idx) d
              							where a.boardtype = ?
              							and a.board_idx = c.board_idx
              							and a.board_idx = d.board_idx
              							order by a.board_idx desc
          						  ) a
          						  where (@rownum:=0)=0
                      ) b
                      where b.num > ? and b.num <= ?`;
      }

      conn.query(sql, [boardtype,boardtype,boardtype,startidx,lastidx], function(err,data){
        if(err){
          console.log(err);
          throw err;
        }
        else {
          console.log(data);
          res.json(data);
        }
      })
    })
    router.get('/select/:board_idx/:board_type', function(req,res){
      let board_idx = req.params.board_idx;
      let board_type = req.params.board_type;
      let sql = '';

      //업데이트 후 에 조회
      let update_sql = 'update luxury.board set views = views + 1 where board_idx = ?'

      if(board_type < 2)
      {
        sql = `select board_idx, userid, name, subject, a.descript descript, boardtype, boardforum, views,
                            reg_date, reg_time, upd_date, upd_time, imgurl,b.descript brand
                     from
                      (
                        select a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
                               a.reg_date, a.reg_time, a.upd_date, a.upd_time, b.imgurl
                        from luxury.board a left outer join luxury.boardimg b
                        on a.board_idx = b.idx
                        where a.board_idx = ?
                      ) a, luxury.code b
                      where a.boardtype = b.major_key
                      and a.boardforum = b.minor_key`
      }
      else{
        sql = ` select a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
                               a.reg_date, a.reg_time, a.upd_date, a.upd_time, b.imgurl
                        from luxury.board a left outer join luxury.boardimg b
                        on a.board_idx = b.idx
                        where a.board_idx = ?`;
      }

      conn.query(update_sql, [board_idx], function(err, data){
        if(err){
          throw err;
        }
        else{
          conn.query(sql, [board_idx], function(err,data){
            if(err){
              throw err;
            }
            else{
              console.log(data)
              res.json(data);
            }
          })
        }
      });

    })
    //board 게시판 수정
    //board 게시판 이미지 및 글 저장
    router.post('/write', upload.array("image"), function(req, res){
      let imgFile = req.files;
      let userid = req.body.userid;
      let subject = req.body.subject;
      let descript = req.body.descript;
      let boardforum = req.body.boardforum;
      let boardtype = req.body.boardtype;


      //자바스크립트 날짜 시간 set
      let reg_date = moment().format("YYYY-MM-DD");
      let hour = moment().hours();
      let minute = moment().minute();

      let reg_hour = "";
      let reg_minute = "";

      reg_hour = validate.time(hour);
      reg_minute = validate.time(minute);

      let reg_time = reg_hour + ":" + reg_minute;

      //imagurl에 대한 max값 set
      const sql_idx = `select max(board_idx) idx from luxury.board`;
      conn.query(sql_idx, function(err, data){
        if(err){
          console.log(err);
          throw err;
        }
        else{
          let idx = data[0].idx + 1;
          //이름 set

          const sql_nickname = `select concat(a.descript, b.descript) nickname
                                from
                                (
                                    select *
                                    from luxury.code
                                    where major_key = 100
                                    order by rand() limit 1
                                ) a,
                                (
                                    select *
                                    from luxury.code
                                    where major_key = 101
                                    order by rand() limit 1
                                ) b`;

          /* 글을 작성할때는 닉네임을 랜덤으로 set 한다 */
          conn.query(sql_nickname, function(err,data){
            if(err){
              console.log(err);
              throw err;
            }
            else{
              let name  = data[0].nickname;
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
              })
            }
          })

        }
      })

    });
    return router;
}
