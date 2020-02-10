import zlib from "zlib";

export const gzip = str =>
  new Promise((resolve, reject) => {
    zlib.gzip(str, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

export const gunzip = buf =>
  new Promise((resolve, reject) => {
    zlib.gunzip(buf, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
