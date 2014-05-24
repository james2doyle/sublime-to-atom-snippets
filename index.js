/**
 * Sublime-to-atom-snippets
 * convert sublime text snippets to atom editot cson snippets
 * Copyright (c) 2014, James Doyle. (MIT Licensed)
 */
var verbose = false;

process.argv.forEach(function (val, index, array) {

    if (val == '--help') {
        console.log('Utility convert sublime text snippets in atom compatible ones. \\n Usage: \\n node index.js [--default-snip-type=source.php] [--verbose] ');
        process.exit(0);
    } else if (val == '-v' || val == '--verbose') {
        verbose = true;
        if (verbose) {
          console.log('Found verbose rule');
        }

    } else if (val == '--default-snip-type' || val == '-dst') {
      default_snip_type = array[index+1];

      if (verbose) {
        console.log('Found default snip type: '+default_snip_type);
      }
    }

});


 var fs = require('fs'),
 path = require('path'),
 async = require('async'),
 jsesc = require('jsesc'),
 xml2js = require('xml2js');

/**
 * generates a cson template out of the xml json object
 * @param  {string}   file     the filename of the current file
 * @param  {object}   snip     the xml json object
 * @param  {function} callback callback with results
 * @return {null}            callbacks
 */
 function makeCson(file, snip, callback) {
  // if there is no description, use the filename
  var info = (snip.description) ? snip.description[0] : path.basename(file, '.sublime-snippet');
  snip.info = jsesc(info);
  // replace double escape
  var content = jsesc(snip.content[0].trim()).replace("\\\\", "\\");
  // cson template. gross.
  if (!snip.scope) {

    if (defaut_snip_type) {

        snip.scope = default_snip_type;

    } else {
      console.log("\n", path.basename(file));
      throw new Error('Scope Must Be Set');
    }
  }
  var template = "\'." + snip.scope[0] + "\':\n  \'" + snip.info + "\':\n    \'prefix\': \'" + snip.tabTrigger + "\'\n    \'body\': \'" + content + "\'";
  callback(null, template);
}

function isSnippet(item, callback) {
  // am I a sublime snippet file?
  callback((item.indexOf('.sublime-snippet') !== -1));
}

/**
 * reads the source folder you decided on
 * @param  {Function} cb the callback
 * @return {array}      array of files that made it through the filter
 */
 function readFolder(srcfolder, cb) {
  async.waterfall([
    function(callback) {
      fs.readdir(__dirname + '/source/' + srcfolder, callback);
    },
    function(files, callback) {
      async.filter(files, isSnippet, function(onlysnips) {
        callback(null, onlysnips);
      });
    }
    ], function(err, results) {
      if (err) {
        throw err;
      }
      cb(srcfolder, results);
    });
}

/**
 * makes all the directories required
 * @param  {string} item the name of the directory to create
 * @return {none}      callback
 */
 function makeDir(folder, cb) {
  folder = __dirname + '/output/'+folder;
  async.waterfall([

    function(callback) {
      fs.exists(folder, function(exists) {
        callback(null, exists);
      });
    },
    function(isThere, callback) {
      if (!isThere) {
        fs.mkdir(folder, function() {
          callback(null, true);
        });
      } else {
        callback(null, false);
      }
    }
    ], function(err, results) {
      if (err) {
        throw err;
      }
      cb(null, results);
    });
}

function handleFile(file) {
  var OUTFILE = file.replace('.sublime-snippet', '.cson');
  OUTFILE = OUTFILE.replace('/source/', '/output/');
  async.waterfall([
    function(callback) {
      fs.readFile(file, callback);
    },
    function(dataToParse, callback) {
      var parser = new xml2js.Parser();
      parser.parseString(dataToParse, callback);
    },
    function(parsed, callback) {

      if (!parsed || !parsed.snippet) {
        console.log('The file: '+file+' does not contain the required <snippet> tag. Forcing quit');
        return  1;
      }
      makeCson(file, parsed.snippet, callback);
    },
    function(csonoutput, callback) {
      fs.writeFile(OUTFILE, csonoutput, callback);
    }
    ], function(err, results) {
      if (err) {
        throw err;
      }
      console.log(path.basename(file) + " has been parsed");
    });
}

function isDir(item, callback) {
  fs.stat(__dirname + '/source/' + item, function(err, stats) {
    callback(stats.isDirectory());
  });
}

function readSourceFolder(cb) {
  async.waterfall([
    function(callback) {
      fs.readdir(__dirname + '/source', callback);
    },
    function(files, callback) {
      async.filter(files, isDir, function(onlydirs) {
        callback(null, onlydirs);
      });
    },
    function(dirs, callback) {
      async.each(dirs, makeDir, function(){
        callback(null, dirs);
      });
    }
    ], function(err, results) {
      if (err) {
        throw err;
      }
      cb(results);
    });
}

function handleContents(srcfolder, files, cb) {
  function prependFiles(item, callback) {
    callback(null, __dirname + "/source/" + srcfolder + "/" + item);
  }
  async.map(files, prependFiles, function(err, longfiles) {
    if (err) {
      throw err;
    }
    async.each(longfiles, handleFile, function(err) {
      if (err) {
        throw err;
      }
      cb();
    });
  });
}

async.waterfall([
  function(callback) {
    readSourceFolder(function(folders) {
      callback(null, folders);
    });
  },
  function(folders, callback) {
    async.each(folders, function(folder) {
      readFolder(folder, function(srcfolder, dirfiles) {
        handleContents(folder, dirfiles, function() {
          callback(null, true);
        });
      });
    });
  }
  ], function(err, results) {
    if (err) {
      throw err;
    }
  });
