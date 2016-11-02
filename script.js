(function() {
    'use strict';
    var optLangage = document.getElementById('marklet-langage');

    var link = document.getElementById('link');
    var wrapper = document.getElementById('wrapper');
    var elEncode = document.getElementById('encodeURI');
    var optUglify = document.getElementById('opt-uglify');

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
            var url = window.URL.createObjectURL(new Blob([text], {type: type}));
            this.list.push(url);
            return url;
        },
        clear: function() {
            for (var i = this.list.length; i--; ) {
                window.URL.revokeObjectURL(this.list[i]);
            }
            this.list = [];
        }
    };

    var markletEditor = ace.edit('marklet-editor');

    // markletEditor.setTheme('ace/theme/twilight');
    markletEditor.getSession().setMode('ace/mode/' + optLangage.value);
    markletEditor.getSession().setUseWrapMode(true);
    markletEditor.$blockScrolling = Infinity;

    markletEditor.on('change', delay(createBookmarklet, 500), false);

    optLangage.addEventListener('change', function() {
        markletEditor = ace.edit('marklet-editor');
        markletEditor.getSession().setMode('ace/mode/' + this.value);
        createBookmarklet();
    }, false);

    elEncode.addEventListener('change', createBookmarklet, false);
    wrapper.addEventListener('change', createBookmarklet, false);
    optUglify.addEventListener('change', createBookmarklet, false);

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

        if (optLangage.value === 'coffee') {
            try {
                code = CoffeeScript.compile(code, {bare: true});
            } catch (e) {
                output.value = e.stack;
                // outputEditor.getSession().setValue(e.stack, 1);
                // "Error on line #{location.first_line + 1}: #{message}"
                return;
            }
        }

        if (wrapper.checked) {
            code = '(function(){' + code + '\n})()';
        }

        if (optUglify.checked) {
            try {
                code = uglify(code);
            } catch (e) {
                output.value = e.message;
                return;
            }
        } else {
            code = code.replace(/\n\s*/g, '');
            code = code.replace(/\s*([^A-Za-z0-9_$])\s*/g, '$1');
        }

        if (elEncode.checked){
            code = encodeURI(code);
        }

        code = 'javascript:' + code.replace(/;\}/g, '}');

        chars.innerHTML = code.length;
        output.value = link.href = code;
        // outputEditor.getSession().setValue(code, 1);
    }

    function rewriteHtml() {
        BlobURL.clear();

        iframe.contentWindow.location.replace(BlobURL.create(htmlEditor.getSession().getValue(), 'text/html'));
    }
}());