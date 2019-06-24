module.exports = function(conn){
    const express = require('express');
    const router = express.Router();  //router하는 객체를 추출

    //event API
    router.get('/', function(req, res){

      const sql = `
      select a.id_seq id, a.videourl videourl, a.subject subject, a.price price
	     ,url
      from luxury.video a, luxury.marketing b
      where a.videourl = b.direct_url
      order by id_seq
      `;
      conn.query(sql, function(err, data){
        if(err){
          console.log(err);
        } else{
          console.log(data);
          res.json(data);
        }
      })
    })

    return router;
}
