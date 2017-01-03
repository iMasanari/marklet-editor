(function() {
    'use strict';

    var link = document.getElementById('link');
    var langage = document.getElementById('marklet-langage');
    var options = {
        enclose: document.getElementById('enclose'),
        mangle: document.getElementById('mangle'),
        keep_fnames: document.getElementById('keep_fnames'),
        unsafe: document.getElementById('unsafe'),
        encode: document.getElementById('encodeURI')
    }

    var chars = document.getElementById('chars');
    var output = document.getElementById('output');
    var iframe = document.getElementById('iframe');

    var delay = function(fnc, time) {
        var timer;

        return function() {
            clearTimeout(timer);

            return timer = setTimeout(fnc, time);
        };
    };

    var BlobURL = {
        list: [],
        create: function(text, type) {
            var url = window.URL.createObjectURL(new Blob([text], { type: type }));
            this.list.push(url);
            return url;
        },
        clear: function() {
            for (var i = this.list.length; i--;) {
                window.URL.revokeObjectURL(this.list[i]);
            }
            this.list = [];
        }
    };

    var markletEditor = ace.edit('marklet-editor');

    // markletEditor.setTheme('ace/theme/twilight');
    markletEditor.getSession().setMode('ace/mode/' + langage.value);
    markletEditor.getSession().setUseWrapMode(true);
    markletEditor.$blockScrolling = Infinity;

    markletEditor.on('change', delay(createBookmarklet, 500), false);

    langage.addEventListener('change', function() {
        markletEditor = ace.edit('marklet-editor');
        markletEditor.getSession().setMode('ace/mode/' + this.value);
        createBookmarklet();
    }, false);

    for (var key in options) {
        if (!options.hasOwnProperty(key)) continue;
        options[key].addEventListener('change', createBookmarklet, false);
    }

    var htmlEditor = ace.edit('html-editor');

    htmlEditor.getSession().setMode('ace/mode/html');
    htmlEditor.getSession().setUseWrapMode(true);
    htmlEditor.$blockScrolling = Infinity;

    htmlEditor.on('change', delay(rewriteHtml, 500), false);

    link.addEventListener('click', runBookmarklet, false);

    document.addEventListener('keydown', function(e) {
        if (e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {
            runBookmarklet(e);
        }
    }, false);

    rewriteHtml();
    createBookmarklet();

    function runBookmarklet(e) {
        e.preventDefault();

        iframe.contentWindow.location = link.href;
    }

    function createBookmarklet() {
        var code = markletEditor.getValue();

        if (langage.value === 'coffee') {
            try {
                code = CoffeeScript.compile(code, { bare: true });
            } catch (e) {
                output.value = e.stack;
                // outputEditor.getSession().setValue(e.stack, 1);
                // "Error on line #{location.first_line + 1}: #{message}"
                return;
            }
        }

        try {
            code = minify(code, {
                enclose: options.enclose.checked,
                mangle: options.mangle.checked,
                unsafe: options.unsafe.checked,
                keep_fnames: options.keep_fnames.checked
            });
        } catch (e) {
            output.value = e.message;
            return;
        }

        if (options.encode.checked) {
            code = encodeURI(code);
        }

        code = 'javascript:' + code;

        chars.innerHTML = code.length;
        output.value = link.href = code;
        // outputEditor.getSession().setValue(code, 1);
    }

    function rewriteHtml() {
        BlobURL.clear();

        iframe.contentWindow.location.replace(BlobURL.create(htmlEditor.getSession().getValue(), 'text/html'));
    }

    function minify(code, options) {
        var toplevel_ast = UglifyJS.parse(code);

        if (options.enclose) toplevel_ast = toplevel_ast.wrap_enclose([]);

        toplevel_ast.figure_out_scope();

        var compressor = new UglifyJS.Compressor({
            unsafe: options.unsafe || false
        });
        var compressed_ast = toplevel_ast.transform(compressor);

        if (options.mangle) {
            compressed_ast.figure_out_scope();
            compressed_ast.compute_char_frequency();
            compressed_ast.mangle_names({
                keep_fnames: options.keep_fnames || false
            });
        }

        return compressed_ast.print_to_string({
            quote_style: 1
        });
    }
})();