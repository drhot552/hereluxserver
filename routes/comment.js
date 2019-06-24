module.exports = function(conn){
  const express = require('express');
  const router = express.Router();  //router하는 객체를 추출
  let validate = require('../module/validate');
  let moment  = require("moment");


  //comment insert 리스트 조회 (닉네임이 잇을경우 없으면 랜덤으로 set)
  router.post('/', function(req, res){
    let board_idx = req.body.board_idx;
    let userid = req.body.userid;
    let descript = req.body.descript;
    let nickname = req.body.name;

    //자바스크립트 날짜 시간 set
    let reg_date = moment().format("YYYY-MM-DD");
    let hour = moment().hours();
    let minute = moment().minute();

    let reg_hour = "";
    let reg_minute = "";

    reg_hour = validate.time(hour);
    reg_minute = validate.time(minute);

    let reg_time = reg_hour + ":" + reg_minute;

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
    conn.query(sql_nickname, function(err,data){
      if(err){
        console.log(err);
        throw err;
      } else {
        //닉네임이 없으면 랜덤으로 부여
        if(!nickname){
          nickname = data[0].nickname;
        }
        //그렇지 않으면 기존 글에 대한 닉네임으로 부여
        const sql = `Insert into luxury.comment(board_idx, userid, name, descript, reg_date, reg_time) values (?,?,?,?,?,?)`;

        conn.query(sql, [board_idx, userid, nickname, descript,reg_date,reg_time], function(err,data){
          if(err){
            console.log(err);
            throw err;
          }
          else {
            res.json(200);
          }
        })
      }
    })
  })
  //comment 대댓글 insert 리스트 조회 (닉네임이 잇을경우 없으면 랜덤으로 set)
  router.post('/commentdown', function(req, res){
    let board_idx = req.body.board_idx;
    let comment_idx = req.body.comment_idx;
    let userid = req.body.userid;
    let descript = req.body.descript;
    let nickname = req.body.name;

    //자바스크립트 날짜 시간 set
    let reg_date = moment().format("YYYY-MM-DD");
    let hour = moment().hours();
    let minute = moment().minute();

    let reg_hour = "";
    let reg_minute = "";

    reg_hour = validate.time(hour);
    reg_minute = validate.time(minute);

    let reg_time = reg_hour + ":" + reg_minute;

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
    conn.query(sql_nickname, function(err,data){
      if(err){
        console.log(err);
        throw err;
      } else {
        //닉네임이 없으면 랜덤으로 부여
        if(!nickname){
          nickname = data[0].nickname;
        }
        //그렇지 않으면 기존 글에 대한 닉네임으로 부여
        const sql = `Insert into luxury.commentdown(comment_idx, board_idx, userid, name, descript, reg_date, reg_time) values (?,?,?,?,?,?,?)`;

        conn.query(sql, [comment_idx, board_idx, userid, nickname, descript,reg_date,reg_time], function(err,data){
          if(err){
            console.log(err);
            throw err;
          }
          else {
            res.json(200);
          }
        })
      }
    })
  })
  //대댓글 set
  router.get('/commentdown/:board_idx', function(req,res){
    let board_idx = req.params.board_idx;
    //업데이트 후에 조회한다.

    const sql = `select comment_idx, board_idx, userid, name, descript, reg_date, reg_time, upd_date, upd_time
                 from luxury.commentdown
                 where board_idx = ?`;
    conn.query(sql, [board_idx], function(err,data){
      if(err){
        console.log(err);
        throw err;
      } else {
        console.log(data);
        res.json(data);
      }
    })
  })
  router.get('/:board_idx', function(req,res){
    let board_idx = req.params.board_idx;
    //업데이트 후에 조회한다.

    const sql = `select comment_idx, board_idx, userid, name, descript, reg_date, reg_time, upd_date, upd_time
                 from luxury.comment
                 where board_idx = ?`;
    conn.query(sql, [board_idx], function(err,data){
      if(err){
        console.log(err);
        throw err;
      } else {
        console.log(data);
        res.json(data);
      }
    })
  })
  router.get('/delete/:comment_idx', function(req,res){
    let comment_idx = req.params.comment_idx;
    //댓글을 삭제한다.

    const sql = `delete from luxury.comment where comment_idx = ?`;
    conn.query(sql, [comment_idx], function(err,data){
      if(err){
        console.log(err);
        throw err;
      } else {
        res.json(200);
      }
    });
  })

  return router;
}
