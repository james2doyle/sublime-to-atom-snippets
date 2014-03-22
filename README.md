Sublime-to-atom-snippets
========================

This little script allows you to convert sublime text snippets to atom editot cson snippets.

### Usage

This is a very lazy script. There is no bin or anything. Just drop a folder full of snippets in the `source` folder and then use `node index.js` to run the script.

It is not recursive. It will only read one level into the source folder.

### Output

This will output a 1:1 xml-to-cson file. So having `source/jquery/$.sublime-snippet` will render to `output/jquery/$.cson`.

### XML variables

If there is **no description set**, this script will use the filename as the description.

If there **is no scope**, it will throw an error.

### Output

The output is mixed quality. There are a bunch of little weird things that I have to compensate for. The CSON isn't as verbose as the XML for sublime snippets.

### Code Quality

Please don't look at the source.