/**
 * noscript MVC framework
 * @namespace
 * @version 0.2.0
 * @tutotial entities
 */
var ns = {};

/**
 * Удобная функция для расстановки TODO, кидает исключение при вызове.
 */
ns.todo = function() {
    throw new Error('Unimplemented');
};

/**
 * Parse query string to object.
 * @param {string} s Query string
 * @returns {object}
 */
ns.parseQuery = function(s) {
    var o = {};

    s.split('&').forEach(function(chunk) {
        var p = chunk.split('=');
        var name = p.shift();
        if (name) {
            // В значении параметра может быть знак равенства
            var value = p.join('=');

            // &c=
            if (typeof value === 'undefined') {
                value = '';

            } else {
                try {
                    value = decodeURIComponent(value);
                } catch(e) {
                    value = '';
                    ns.log.info('ns.parseQuery.invalid-param', {
                        query: s,
                        chunk: chunk
                    });
                }
            }

            if (name in o) {
                // если параметры имеют вид ?id=1&id=2&id=3,
                // то на выходе должен получиться массив

                // если массива еще нет, то создаем его
                if (!Array.isArray(o[name])) {
                    o[name] = [ o[name] ];
                }

                o[name].push(value);
            } else {
                o[name] = value;
            }
        }
    });

    return o;
};

/**
 * Performs json templating.
 * @param {*} json
 * @param {string} mode
 * @param {string} [module='main']
 * @returns {Element}
 */
ns.renderString = function(json, mode, module) {
    return yr.run(module || 'main', json, mode);
};

ns.renderNode = function(json, mode, module) {
    return ns.html2node(ns.renderString(json, mode, module));
};

/**
 * Производит первоначальную инициализацию noscript.
 */
ns.init = function() {
    ns.action.init();
    ns.router.init();
    ns.history.init();
    ns.initMainView();
};

/**
 * Инициализирует корневой View.
 */
ns.initMainView = function() {
    var mainView = ns.View.create('app');
    mainView._setNode(document.getElementById('app'));
    mainView.invalidate();

    /**
     * Корневой View.
     * @type {ns.View}
     */
    ns.MAIN_VIEW = mainView;
};

/**
 * Выполняет проверку, что первый аргумент истиннен.
 * Если это не так - кидает ошибку.
 * @param {?} truthy Любое значение, которое проверяется на истинность.
 * @param {string} contextName Контекст для быстрого поиска места возникновения ошибки.
 * @param {string} message Сообщение об ошибке.
 */
ns.assert = function(truthy, contextName, message) {
    /* jshint unused: false */
    if (!truthy) {
        ns.assert.fail.apply(this, Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * Кидает ошибку с понятным сообщением.
 * @param {string} contextName Контекст для быстрого поиска места возникновения ошибки.
 * @param {string} message Сообщение об ошибке.
 */
ns.assert.fail = function(contextName, message) {
    var messageArgs = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < messageArgs.length; i++) {
        message = message.replace('%s', messageArgs[i]);
    }
    throw new Error('[' + contextName + '] ' + message);
};

/**
 * Строит ключ по готовому объекту параметров.
 * @param {string} prefix Префикс ключа.
 * @param {object} params Объект с параметрами составляющими ключ.
 * @returns {string} Строка ключа.
 */
ns.key = function(prefix, params) {
    var key = prefix;
    params = params || {};
    for (var pName in params) {
        key += '&' + pName + '=' + params[pName];
    }
    return key;
};

/**
 * Clean internal data after tests
 */
ns.reset = function() {
    // в сборке для node.js его нет
    if (ns.action) {
        ns.action._reset();
    }
    ns.router._reset();
    ns.layout._reset();
    ns.Model._reset();
    ns.View._reset();
    ns.request._reset();
    ns.page._reset();

    ns.MAIN_VIEW = null;
};
