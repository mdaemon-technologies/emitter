/*
*    Copyright (C) 1998-2022  MDaemon Technologies, Ltd.
*
*    This library is free software; you can redistribute it and/or
*    modify it under the terms of the GNU Lesser General Public
*    License as published by the Free Software Foundation; either
*    version 2.1 of the License, or (at your option) any later version.
*
*    This library is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*    Lesser General Public License for more details.
*
*    You should have received a copy of the GNU Lesser General Public
*    License along with this library; if not, write to the Free Software
*    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
*    USA
*/

const is = (function () {
  var isObject = function (val: any) {
    return typeof val === "object" && val !== null && !Array.isArray(val);
  };

  var isString = function (str: any) {
    return typeof str === "string";
  };

  var isArray = function (arr: any) {
    return Array.isArray(arr);
  };

  var isBoolean = function (bool: any) {
    return typeof bool === "boolean";
  };

  var isNumber = function (num: any) {
    return typeof num === "number";
  };

  var isFunction = function (func: any) {
    return typeof func === "function";
  };

  var isNull = function (val: any) {
    return val === null;
  };

  var isUndefined = function (val: any) {
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