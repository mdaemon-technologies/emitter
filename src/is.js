is = (function () {
  var isObject = function (val) {
    return typeof val === "object" && val !== null && !Array.isArray(val);
  };

  var isString = function (str) {
    return typeof str === "string";
  };

  var isArray = function (arr) {
    return Array.isArray(arr);
  };

  var isBoolean = function (bool) {
    return typeof bool === "boolean";
  };

  var isNumber = function (num) {
    return typeof num === "number";
  };

  var isFunction = function (func) {
    return typeof func === "function";
  };

  var isNull = function (val) {
    return val === null;
  };

  var isUndefined = function (val) {
    return val === undefined || typeof val === "undefined";
  };

  return {
    string: isString,
    object: isObject,
    array: isArray,
    bool: isBoolean,
    number: isNumber,
    func: isFunction,
    nul: isNull,
    undef: isUndefined
  };
}());

export default is;