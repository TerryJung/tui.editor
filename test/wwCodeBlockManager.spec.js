'use strict';

var WysiwygEditor = require('../src/js/wysiwygEditor'),
    EventManager = require('../src/js/eventManager'),
    WwCodeBlockManager = require('../src/js/wwCodeBlockManager');

describe('WwCodeBlockManager', function() {
    var $container, em, wwe, mgr;

    beforeEach(function() {
        $container = $('<div />');

        $('body').append($container);

        em = new EventManager();

        wwe = new WysiwygEditor($container, em);

        wwe.init();

        mgr = new WwCodeBlockManager(wwe);
    });

    //we need to wait squire input event process
    afterEach(function(done) {
        setTimeout(function() {
            $('body').empty();
            done();
        });
    });

    describe('isInCodeBlock', function() {
        it('check if passed range is in codeblock', function() {
            var range = wwe.getEditor().getSelection().cloneRange();

            wwe.getEditor().setHTML('<pre><div>test</div></pre>');

            range.setStart(wwe.get$Body().find('div')[0], 0);
            range.collapse(true);

            expect(mgr.isInCodeBlock(range)).toBe(true);
        });
    });

    describe('key handlers', function() {
        describe('BACKSPACE', function() {
            it('_revmoeCodeblockIfNeed() remove codeblock if codeblock has one code tag when offset is 0', function() {
                var range = wwe.getEditor().getSelection().cloneRange();

                wwe.setValue('<pre><div>test</div></pre>');

                range.setStart(wwe.get$Body().find('div')[0].childNodes[0], 0);
                range.collapse(true);

                wwe.getEditor().setSelection(range);

                em.emit('wysiwygKeyEvent', {
                    keyMap: 'BACK_SPACE',
                    data: {
                        preventDefault: function() {}
                    }
                });

                expect(wwe.get$Body().find('div').length).toEqual(2);
                expect(wwe.get$Body().find('div').eq(0).text()).toEqual('test');
                expect(wwe.get$Body().find('pre').length).toEqual(0);
            });

            it('_revmoeCodeblockIfNeed() remove codeblock and make one br if there is no content', function() {
                var range = wwe.getEditor().getSelection().cloneRange();

                wwe.setValue('<pre><div><br></div></pre>');

                range.setStart(wwe.get$Body().find('div')[0], 0);
                range.collapse(true);

                wwe.getEditor().setSelection(range);

                em.emit('wysiwygKeyEvent', {
                    keyMap: 'BACK_SPACE',
                    data: {
                        preventDefault: function() {}
                    }
                });

                expect(wwe.get$Body().find('div').length).toEqual(2);
                expect(wwe.get$Body().find('pre').length).toEqual(0);
            });
        });
    });

    describe('_copyCodeblockTypeFromRangeCodeblock', function() {
        it('copy codeblock\'s type to range codeblock', function() {
            var codeblock = $('<pre><code>test</code><br></pre'),
                range;

            wwe.setValue('<pre><code class="lang-javascript" data-language="javascript">'
                         + 'mycode</code></pre>');

            range = wwe.getEditor().getSelection().cloneRange();

            range.setStart(wwe.get$Body().find('div')[0], 1);
            range.collapse(true);

            mgr._copyCodeblockTypeFromRangeCodeblock(codeblock[0], range);

            expect(codeblock.hasClass('lang-javascript')).toBe(true);
            expect(codeblock.attr('data-language')).toEqual('javascript');
            expect(codeblock.attr('data-te-codeblock')).toBeDefined();
        });
    });

    describe('prepareToPasteOnCodeblock', function() {
        beforeEach(function() {
            var range;

            wwe.setValue('<pre><code class="lang-javascript" data-language="javascript">'
                         + 'mycode</code></pre>');

            range = wwe.getEditor().getSelection().cloneRange();

            range.setStart(wwe.get$Body().find('div')[0], 1);
            range.collapse(true);

            wwe.getEditor().setSelection(range);
        });
        it('if fragment is complete codeblock then copy attribute from current selected codeblock\' to fragment', function() {
            var codeblock = $('<pre><code>test</code><br></pre>');
            var fragment, resultFragment;

            fragment = wwe.getEditor().getDocument().createDocumentFragment();
            $(fragment).append(codeblock);

            resultFragment = mgr.prepareToPasteOnCodeblock([].slice.call(fragment.childNodes));

            expect($(resultFragment).find('pre').attr('class')).toEqual('lang-javascript');
            expect($(resultFragment).find('pre').attr('data-language')).toEqual('javascript');
        });
        it('if current selection is within codeblock then make textContent of paste data codeblock', function() {
            var codeblock = $('<div>test<br></div><div>test2<br></div>');
            var fragment, resultFragment;


            fragment = wwe.getEditor().getDocument().createDocumentFragment();
            $(fragment).append(codeblock);

            resultFragment = mgr.prepareToPasteOnCodeblock([].slice.call(fragment.childNodes));

            expect($(resultFragment).find('pre').attr('class')).toEqual('lang-javascript');
            expect($(resultFragment).find('pre').attr('data-language')).toEqual('javascript');
            expect($(resultFragment).find('div').eq(0).text()).toEqual('test');
            expect($(resultFragment).find('div').eq(1).text()).toEqual('test2');
        });
    });
    describe('Event', function() {
        it('split to each code tag in code block on line feed on wysiwygSetValueAfter', function() {
            var codeblock;

            wwe.setValue('<pre><code class="lang-javascript" data-language="javascript">'
                         + 'test\ntest2\n\ntest3\n</code></pre>');

            codeblock = wwe.get$Body().find('pre');

            expect(codeblock.length).toEqual(1);
            expect(codeblock.find('div').length).toEqual(4);
            expect(codeblock.hasClass('lang-javascript')).toBe(true);
            expect(codeblock.attr('data-language')).toEqual('javascript');
            expect(codeblock.attr('data-te-codeblock')).toBeDefined();
        });

        it('join each line of code block to one codeblock on wysiwygProcessHTMLText', function() {
            wwe.getEditor().setHTML([
                '<pre>',
                '<div>test1</div>',
                '<div>test2</div>',
                '</pre>'
            ].join(''));

            expect(wwe.getValue()).toEqual([
                '<pre>',
                '<code>test1\ntest2</code>',
                '</pre>'
            ].join(''));
        });

        it('join each line of code block to one codeblock on wysiwygProcessHTMLText with code attr', function() {
            wwe.getEditor().setHTML([
                '<pre class="lang-javascript" data-language="javascript">',
                '<div>test1</div>',
                '<div>test2</div>',
                '</pre>'
            ].join(''));

            expect(wwe.getValue()).toEqual([
                '<pre>',
                '<code class="lang-javascript" data-language="javascript">test1\ntest2</code>',
                '</pre>'
            ].join(''));
        });

        it('join each line of multiple code block to one codeblock on wysiwygProcessHTMLText', function() {
            wwe.getEditor().setHTML([
                '<pre class="lang-javascript" data-language="javascript">',
                '<div>test1</div>',
                '<div>test2</div>',
                '</pre>',
                '<pre class="lang-javascript" data-language="javascript">',
                '<div>test3</div>',
                '<div>test4</div>',
                '</pre>'
            ].join(''));

            expect(wwe.getValue()).toEqual([
                '<pre><code class="lang-javascript" data-language="javascript">test1\ntest2</code></pre>',
                '<pre><code class="lang-javascript" data-language="javascript">test3\ntest4</code></pre>'
            ].join(''));
        });
    });
    describe('splitCodeblockToEachLine', function() {
        it('update pre tag with language attributes and add data-te-codeblock attribute', function() {
            var frag = document.createDocumentFragment();
            var codeblock;

            $(frag).append('<pre><code class="lang-javascript" data-language="javascript">'
                         + 'test</code></pre>');


            mgr.splitCodeblockToEachLine(frag);

            codeblock = $($(frag).find('pre'));

            expect(codeblock.length).toEqual(1);
            expect(codeblock.hasClass('lang-javascript')).toBe(true);
            expect(codeblock.attr('data-language')).toEqual('javascript');
            expect(codeblock.attr('data-te-codeblock')).toBeDefined();
        });
        it('trim last linefeeds', function() {
            var frag = document.createDocumentFragment();
            var codeblock;

            $(frag).append('<pre><code class="lang-javascript" data-language="javascript">'
                         + 'test\n\ntest\n\n\n</code></pre>');


            mgr.splitCodeblockToEachLine(frag);

            codeblock = $($(frag).find('pre'));

            expect(codeblock.find('div').length).toEqual(3);
        });

        it('makes normal codeblock with pre > code > textlines', function() {
            var frag = document.createDocumentFragment();
            var codeblock;

            $(frag).append('<pre><code class="lang-javascript" data-language="javascript">'
                         + 'test\ntest2\n\ntest3\n</code></pre>');


            mgr.splitCodeblockToEachLine(frag);

            codeblock = $($(frag).find('pre'));

            expect(codeblock.find('div').length).toEqual(4);
        });

        it('Makes normal codeblock with pre > divs', function() {
            var frag = document.createDocumentFragment();
            var codeblock;

            $(frag).append('<pre>'
                         + '<div>test</div>'
                         + '<div>test2</div>'
                         + '<div>test3</div>'
                         + '</pre>');


            mgr.splitCodeblockToEachLine(frag);

            codeblock = $($(frag).find('pre'));

            expect(codeblock.find('div').length).toEqual(3);
        });
    });
});
