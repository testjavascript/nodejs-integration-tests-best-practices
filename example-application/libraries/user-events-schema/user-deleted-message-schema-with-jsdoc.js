// // options: object with empty fields
// // intellisense
// // validation
// // deprecation of field

// module.exports = class UserDeletedMessageSchemax {
//   /**
//    * @param  {} messageToReadFrom
//    */
//   static factor(messageToReadFrom) {
//     const ourClass = new UserDeletedMessageSchemax();
//     return Object.assign(ourClass, messageToReadFrom);
//   }

//   validate() {
//     return this.userId && this.deletionDate;
//   }

//   /**
//    * @type {number}
//    */
//   get userId() {
//     return this._userId;
//   }

//   /**
//    * @type {date}
//    */
//   get deletionDate() {
//     return this._deletionDate;
//   }

//   /**
//    * @type {string}
//    * @deprecated This get be obtained now from the user Microservice
//    */
//   get reason() {
//     console.warn('⚠️ This field is obsolete and will get removed soon');
//     return this._reason;
//   }
// };
