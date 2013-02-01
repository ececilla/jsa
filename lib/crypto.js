var assert = require('assert')
var crypto = require('crypto')
var SECRET_KEY = "mysecretkey";
var ENCODING = 'base64';
var text = "This is the text to cipher!";

var cipher = crypto.createCipher('des-ede3-cbc', SECRET_KEY);
var cryptedPassword = cipher.update(text,'ascii',ENCODING);
cryptedPassword+= cipher.final(ENCODING);

var decipher = crypto.createDecipher('des-ede3-cbc', "mysecretkey");
var decryptedPassword = decipher.update(cryptedPassword, ENCODING,'ascii');
decryptedPassword += decipher.final('ascii');

//assert.equal(text, decryptedPassword);

console.log("Crypted Text:", cryptedPassword);
console.log("Decrypted Text:", decryptedPassword);

