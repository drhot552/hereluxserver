
module.exports = function(conn){
    const express = require('express');
    const auth = require('./auth');
    const router = express.Router();  //router하는 객체를 추출
    // 날짜 세팅
    let moment  = require("moment");
    let validate = require('../module/validate');

    //비밀번호
    var bkfd2Password = require('pbkdf2-password'); //비밀번호 암호화
    var hasher = bkfd2Password(); //비밀번호 해쉬


    //event API
    router.post('/', function(req, res){
      const id = req.body.id;
      const password = req.body.password;

      //자바스크립트 날짜 시간 set
      let reg_date = moment().format("YYYY-MM-DD");
      let hour = moment().hours();
      let minute = moment().minute();
      let reg_hour = "";
      let reg_minute = "";

      reg_hour = validate.time(hour);
      reg_minute = validate.time(minute);

      let reg_time = reg_hour + ":" + reg_minute;

      //먼저 아이디중복체크를 한다 여기서 중복하는 아이디가 있으면
      const sql_dup = `select count(*) cnt
                       from luxury.hluser
                       where id = ?`;
      conn.query(sql_dup, id, function(err,data){
        if(err){
          console.log(err);
        }
        else{
          if(data[0].cnt == 1){
            res.json(300);
          }
          //중복이 아니라면 성공
          else{
            const sql =`insert into luxury.hluser values (?,?,?,?,?)`;
            //비밀번호 암호화 settings
            hasher({password:password}, function(err, pass, salt, hash){
              var password_hash = hash;
              var salt = salt;

              if(password_hash){
                conn.query(sql,[id,password_hash,reg_date,salt,reg_time], function(err, data){
                  if(err){
                    console.log(err);
                    return res.status(401).json({error: 'Register Database Error'})
                 } else {
                    //accessToken 등록 완료 시
                    res.json(200);
                  }
                })
              }

            })

          }
        }
      });
    })
    return router;
}
