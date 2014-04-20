# ns.Model

Модель представляет собой данные.
Она однозначно идентифицируется своим ключом, который строится во время инициализации.
Разный ключ всегда означает разный экземпляр модели.

- [Декларация](#Декларация)
  - [ctor](#ctor)
  - [events](#events)
  - [methods](#methods)
  - [params](#params)
- [Работа с данными](#Работа-с-данными)
- [Постобработка данных](#Пре--и-постобработка-данных)
  - extractData(#extractdata)
  - extractError(#extracterror)
  - hasDataChanged(#hasdatachanged)
  - preprocessData(#preprocessdata)
- [События](#События)

## Декларация

Определение новой модели происходит через статическую функцию `ns.Model.define`
```js
ns.Model.define('modelName', modelDeclObject[, baseModel])
```

Объект-декларация состоит из следующих свойств.

### ctor

`ctor` - это функция-конструтор. Обратите внимание, что он вызывается самым первым, до инициализации самой модели, т.о. в конструкторе еще не доступны некоторые свойства.

```
/**
 * @classdesc prj.mMyModel
 * @augments ns.Model
 */
ns.Model.define('my-model', {
    /**
     * @constructs prj.mMyModel
     */
    ctor: function() {
        this._state = 'initial';
        this.CONST = 100;
    }
});
```

### `events`

`events` - объект с декларацией подписок на события noscript.

Любая подписка имеет вид:
```json
{
    "на что подписаться": "обработчик"
}
```
Обработчиком может быть название метода из прототипа или функция.

Пример:
```js
{
    "my-custom-event": "onCustomEvent",
    "my-custom-show@show": "onCustomShow"
}
```

### methods

`methods` - объект с методами. По сути является прототипом объекта.

```
/**
 * @classdesc prj.mMyModel
 * @augments ns.Model
 */
ns.Model.define('my-model', {
    /** @lends prj.mMyModel.prototype
    methods: {
        BAR: 100
        foo: function(){}
    }
});
```

### params

Параметры нужны для как для построения ключа, так и для запроса моделей с сервера.

```js
ns.Model.define('my-model', {
    params: {
        //  Любое значение, кроме null расценивается как дефолтное значение этого параметра.
        'author-login': null,
        'album-id': null,

        //  Этим двум параметрам заданы дефолтные значения.
        'page': 0,
        'pageSize': 20
    }
});
```

## Работа с данными

Методы для получения данных:
 - `#getData()` - возвращает весь объект данных модели. Этот метод можно переопределять для доп. обработки данных. Например, для коллекции этот метод собирает актуальные данных из всех элементов.
 - `#get(jpath)` - выбирает данные по jpath и приводит результат к упрощенному виду. Результат приведения зависит как от самих данных, так и от jpath. Поэтому при изменениях формат результата может меняться.
```js
{
    "foo": "1",
    "bar": [
        { "id": 1 }
    ]
}
this.get('.foo') -> "1"
this.get('.bar.id') -> ["1"]
```
 - `#select(jpath)` - выбирает данные по jpath. В отличии от `#get`, не занимается приведением и всегда возвращает **массив** результатов выборки, т.о. формат результат остается стабильным при изменениях.
```js
{
    "foo": "1",
    "bar": [
        { "id": 1 }
    ]
}
this.get('.foo') -> ["1"]
this.get('.bar.id') -> ["1"]
```

Методы для изменения данных:
 - `#set(jpath, value)` - изменяет данные по jpath. Поддерживаются только несложные jpath.
```
this.set('.foo', 2);
```
 - `#setData(data)` - устаналивает полностью новые данные. В частности, этот метод вызывается при получении данных с сервера.

## Пре- и постобработка данных

### extractData

Метод извлекает данные из ответа сервера. По умолчанию берется поле `data` из ответа. Если метод не возвращает данные, то считается, что модель загружена с ошибкой.
```js
ns.Model.define('my-model', {
    methods: {
        extractData: function(serverResponse) {
            if (serverResponse) {
                return serverResponse.result;
            }
        }
    }
});
```

### extractError

Метода извлекает данные об ошибке сервера. По умолчанию берется поле `error` из ответа.

Метод вызывается, когда `#extractData()` не вернул данные.

```js
ns.Model.define('my-model', {
    methods: {
        extractError: function(serverResponse) {
            if (serverResponse) {
                return serverResponse.error;
            }
        }
    }
});
```

### hasDataChanged

Этот метод может контроллировать изменились ли данные на самом деле, чтобы не вызывать лишних события и перерисовок.
Аргументом метода являются новые данные, а старые можно получить способами описанными выше, например `#getData`. Должен вернуть `boolean`.

```js
ns.Model.define('my-model', {
    methods: {
        hasDataChanged: function(newData) {
            var oldData = this.getData;
            // изменяем данные, только если изменилось поле id
            return oldData.id !== newData.id
        }
    }
});
```

### preprocessData

Этот метод позволяет обработать полученные данные.
Аргументом метода являются новые данные, должен вернуть обработанные данные.

```
ns.Model.define('my-model', {
    methods: {
        _index: null,
        preprocessData: function(newData) {
            var that = this;
            // строим индекс для быстрого поиска
            newData.forEach(function(item) {
                that._index[item.id] = item;
            });
            return newData;
        }
    }
});
```

## События

 - `ns-model-changed` - модель изменилась. В аргументах приходит jpath, по которому было сделано изменение. Если он пустой, то изменилась вся модель (обычно методом `#setData()`)
 - `ns-model-changed<.jpath>` - изменились данные по указанному jpath. В аргументах приходит jpath, по которому было сделано изменение. События кидаются иерархично, т.о. для `.for.bar` будет три события: `ns-model-changed.foo.bar`, `ns-model-changed.foo`, `ns-model-changed`
 - `ns-model-destroyed` - модель была инвалидированна и уничтожена.
 - `ns-model-touched` - у модели изменилась версия. Такое событие будет как результатом изменения данных через `#set` или `#setData`, так и прямым вызовом метода `#touch()`