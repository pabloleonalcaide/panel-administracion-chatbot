const bcrypt = require('bcrypt');
const redis = require('redis');


var PersistService = class {
    constructor() {
        this.client = redis.createClient(
            process.env.REDIS_URL || 'redis://127.0.0.1:6379');
    }

    create_user(user, password) {
        var self = this;
        let keys;
        let datos;
        let data;
        let map;
        let exists = false;
        return self.client.hlen('users', function(err, userlength) {
            const valido = userlength == 0 ? '1' : '0';
            if(userlength == 0){
                bcrypt.hash(password, 10, function(err, hash){
                    self.client.hmset(
                        'users',
                        user,
                        JSON.stringify(
                            {'password': hash, 'valido': valido} ));
                });
            }else{
                self.get_all_users(
                    function(err, reply) {
                        keys = Object.keys(reply);
                        datos = Object.values(reply);
                        data = datos.map(function(element){
                            return JSON.parse(element);
                        });
                        map = keys.map( function(x, i){
                            return {"user": x, "passwd": data[i].password, "valido": data[i].valido};
                        }.bind(self));

                    map.forEach(function(element){
                        if(element.user == user){
                            exists = true;
                        }
                    });
                    if(exists == true)
                        return;
                    else{
                        bcrypt.hash(password, 10, function(err, hash){
                            self.client.hmset(
                                'users',
                                user,
                                JSON.stringify(
                                    {'password': hash, 'valido': valido} ));
                        });
                    }
                    });
            }
        });
    }


    delete_users(){
        this.client.del('users');
    }

    set_user(user, valido){
        var self = this;
        let keys;
        let password;
        let datos;
        let data;
        let map;
        this.get_all_users(
            function(err, reply) {
                keys = Object.keys(reply);
                datos = Object.values(reply);
                data = datos.map(function(element){
                    return JSON.parse(element);
                });
                map = keys.map( function(x, i){
                    return {"user": x, "passwd": data[i].password, "valido": data[i].valido};
                }.bind(this));
                map.forEach(function(element) {
                    if(element.user == user){
                        password = element.passwd;
                        self.client.hmset(
                            'users',
                                user,
                                JSON.stringify(
                                {'password': password, 'valido': valido } ));
                    }
                });
            });
    }
    validate_user(user){
        this.set_user(user, '1');
    }
    deny_user(user){
       this.set_user(user, '0');
    }
    get_all_users(callback) {
        return this.client.hgetall('users', callback);
    }
    create_bot(bot, token) {
        var self = this;
        return      self.client.hmset(
                        'bots',
                         bot,
                         JSON.stringify(
                            {'token': token } ));
    }

    get_all_bots(callback) {
        return this.client.hgetall('bots', callback);
    }
}

module.exports = PersistService;