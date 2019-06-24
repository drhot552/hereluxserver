module.exports = function(conn){
    const express = require('express');
    const auth = require('./auth');
    const router = express.Router();  //router하는 객체를 추출
    //비밀번호
    var bkfd2Password = require('pbkdf2-password'); //비밀번호 암호화
    var hasher = bkfd2Password(); //비밀번호 해쉬

    //event API
    router.post('/', function(req, res){
      const id = req.body.id;
      const password = req.body.password;

      const sql =`SELECT id, password, salt
                  FROM luxury.hluser
                  WHERE id = ?`;
      conn.query(sql,[id], function(err, data){
        if(err){
          console.log(err);
          return res.status(401).json({error: 'System Database Error'})
        } else {
          //accessToken

          if(data.length > 0){
            return hasher({password:password, salt:data[0].salt}, function(err,pass,salt,hash){
                //해쉬값과 패스워드값이 같으면
                if(hash  == data[0].password){
                  const accessToken = auth.signToken(id);
                  res.json({accessToken});
                }
                else{
                  //패스워드가 틀리면
                  console.log('password failure');
                  res.json(302);
                }
            });

          }
          else{
            //id가 틀릴경우
            console.log('login failure');
            res.json(301);
          }
        }
      })
    })
    return router;
}
