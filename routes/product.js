module.exports = function(conn){
    const express = require('express');
    const router = express.Router();  //router하는 객체를 추출

    //favorite 랜덤으로
    router.get('/:user', function(req, res){
      var user = req.params.user;
      //code b-> 대카테고리, code c->중카테고리
      const sql = `
      select id, name, category_large, b.descript category_large_name, category_middle, size, color, price
            from luxury.product a, luxury.code b
            where id not in (select id from luxury.productlist where userid = ?)
            and b.major_key = 1
            and a.category_large = b.minor_key
            order by rand() limit 1

      `;
      conn.query(sql,user,function(err, data){
        if(err){
          res.json(501);
        } else{
          console.log(data);
          res.json(data);
        }
      })
    })
    //product imageget
    router.get('/image/:id', function(req, res){
      var product_id = req.params.id;
      const sql = `
        select url, source
        from luxury.productimg
        where product_id = ?
      `;
      conn.query(sql, product_id, function(err, data){
        if(err){
          res.json(501);
        } else {
          console.log(data);
          res.json(data);
        }
      })
    })
    //상품상세 detail
    router.get('/detail/:id', function(req,res){
      var id = req.params.id;

      const sql = ` select id, a.category_large, c.descript as category_large_name, category_middle, d.descript category_middle_name, name, size, color, price, star, url, count
        					  from luxury.product a, luxury.productimg b, luxury.code c, luxury.code d
        					  where a.id = b.product_id
        					  and c.major_key = 1
        					  and a.category_large = c.minor_key
        					  and d.major_key = a.category_large * 10 + 1
        					  and a.category_middle = d.minor_key
        					  and a.id = ?
                    `;
      conn.query(sql, id, function(err, data){
        if(err){
          res.json(501);
        } else {
          console.log(data);
          res.json(data);
        }
      })

    })
    //상품 category select
    router.get('/ranking/:category/:key/:page', function(req,res){
      var key = req.params.key;
      var page = req.params.page;
      var category = req.params.category;
      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      var range = 0;
      var sql = '';

      //전체일때
      if(key != 99){
        range = key;
      }
      //대 카테고리
      if(category == 1)
      {
        sql = `select id, descript as category_large_name, name, size, color, avg, url
                      from (
              						select @rownum:=@rownum+1 num, id, descript, name, size, color, avg, url
              						from (
              							select  a.id id, c.descript, a.name, a.size, a.color, a.price, round(a.star/a.count,2) avg, b.url
              							from luxury.product a, luxury.productimg b, luxury.code c
              							where a.id = b.product_id
                            and c.major_key = 1
                            and a.category_large = c.minor_key
                            and a.category_large between ? and ?
                            and a.star > 0
              							order by round(a.star/a.count,2) desc
              						) a
              						where (@rownum:=0)=0
                      ) b
                      where b.num > ? and b.num <= ?
                    `;
      }
      //중카테고리
      else if(category == 2){
        sql =  `select id, descript as category_large_name, name, size, color, avg, url
                      from (
              						select @rownum:=@rownum+1 num, id, descript, name, size, color, avg, url
              						from (
              							select  a.id id, c.descript, a.name, a.size, a.color, a.price, round(a.star/a.count,2) avg, b.url
              							from luxury.product a, luxury.productimg b, luxury.code c
              							where a.id = b.product_id
                            and c.major_key = 1
                            and a.category_large = c.minor_key
                            and a.category_middle between ? and ?
                            and a.star > 0
              							order by round(a.star/a.count,2) desc
              						) a
              						where (@rownum:=0)=0
                      ) b
                      where b.num > ? and b.num <= ?
                    `;
      }
      else {
        res.json(501);
      }

      conn.query(sql, [range,key,startidx,lastidx], function(err, data){
        if(err){
          res.json(501);
        } else {
          console.log(data);
          res.json(data);
        }
      })

    })

    //mylist
    router.get('/mylist/:id/:page', function(req, res){
      var userid = req.params.id;
      var page = req.params.page;
      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      const sql = `
      select id, userid, name, size, color, price,star,url
      from
      (
        select @rownum:=@rownum+1 num, a.id id, b.userid, a.name, a.size, a.color, a.price, a.star, c.url
						  from luxury.product a, luxury.productlist b, luxury.productimg c
						  where b.userid = ?
						  and a.id = b.id
              and a.id = c.product_id
						  and b.star >= 4
						  and (@rownum:=0)=0
      ) a
      where a.num > ? and a.num <= ?
      `;
      conn.query(sql, [userid,startidx,lastidx], function(err, data){
        if(err){
          //select error
          res.json(501);
        } else{
          console.log(data);
          res.json(data);
        }
      })
    })
    //favorite 리스트
    router.post('/list', function(req, res){
      var id = req.body.id;
      var user = req.body.user;
      var rating = req.body.rating;
      //insert 후 select
      const sql = `Insert into luxury.productlist(id,userid,star) values (?,?,?)`

      conn.query(sql,[id,user,rating], function(err, data){
        if(err){
          //insert error
          res.json(500);
        } else {
          //해당별점 채점
          const sql_update = `update luxury.product
                              set star =  star + ?, count = count + 1
                              where id = ?`;
          conn.query(sql_update, [rating,id], function(err, updatedate){
            if(err){
              res.json(502);
            } else{
              const sql_fetch = `select a.id, a.name, b.descript, a.category_middle, a.size, a.color, a.price, c.url, c.source
              from luxury.product a, luxury.productimg c, luxury.code b
              where a.id not in (select id from  luxury.productlist where userid = ?)
              and a.id = c.product_id
              and a.category_large = b.minor_key
              and b.major_key = 1
              and a.category_middle
              order by rand() limit 1`;

              conn.query(sql_fetch, user,function(err,fetchdata){
                if(err){
                  //select error
                  res.json(501);
                } else {
                  res.json(fetchdata);
                }
              });
            }
          });
        }
      })
    })
    return router;
}
