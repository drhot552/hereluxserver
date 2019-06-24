module.exports = function(conn){
    const express = require('express');
    const router = express.Router();  //router하는 객체를 추출

    //event API
    router.get('/', function(req, res){
      const sql = `
      	select brands_name,logoimgurl, url
      	from luxury.user
      	where brands_name in
                        		(select brands_name
                        		 from luxury.marketing
                        		 where use_yn = 'Y'
                        		 group by brands_name)
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
    router.get('/:brands_name', function(req, res){
      let brands_name = req.params.brands_name;
      const sql = `
        select img_url, direct_url, subtitle, brands_name, subject, event_start,event_end,event_day, content_type
        from luxury.marketing
        where use_yn = 'Y'
        and brands_name = ?
	order by event_id desc
      `;
      conn.query(sql, brands_name ,function(err, data){
        if(err){
          console.log(err);
        } else {
          console.log(data);

          res.json(data);
        }
      })
    })
    return router;
}
