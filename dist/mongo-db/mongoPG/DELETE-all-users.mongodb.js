const { ObjectId } = require("mongodb");

use('local');
// db.getCollection('auth-users-data').deleteMany({})
db.getCollection('auth-users-data').updateOne({ _id: new ObjectId('676490ed772b07abdaa16aa9') }, {$set:{
  userId: 'andrey5',
  password: '$2b$10$oXWhh2idPD.QwzRYaOipdOSjL.gp3Cx8h6BApukGUZJY7G.4LL9HS',
  email: 'aandrusenko888@yandex.ru',
  token: '7bc6afdd-d978-4770-9bea-6f7b937f4e37'
}})