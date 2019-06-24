module.exports = (function() {
	    return {
	        dev: { // localhost
	            host: 'luxurydb.ceuzzas6aewi.ap-northeast-2.rds.amazonaws.com',
	            port: '3306',
	            user: 'root',
	            password: 'alswo5293',
	            database: 'luxury'
	        },
	        real: { // real server db info
	            host: 'luxury.cd43xs6awqmk.ap-northeast-2.rds.amazonaws.com',
    				 user : 'luxury',
    		 password : 'alsskwns!23',
    		 database : 'luxury',
	            port: '3306'
	        }
	    }
	})();
