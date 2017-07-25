# Perseus

Perseus is Khan Academy's new exercise question editor and renderer. It allows
you to create and display interactive questions.

## Development

```
dev                   # (development) compiles into build/perseus-1.js and build/perseus-1.css
build                 # (production) compiles into build/perseus-1.js and build/perseus-1.css
make watch            # use watchify to auto compile perseus
make server PORT=9000 # runs the perseus server
```

### 開發

#### `make watch`
利用 `watchify` 來偵測檔案的變動，並自動編譯。

#### `make server`
可以開一個輕量的 Web server (php) 來開發 perseus。

預設網址： http://localhost:9000 。如要改變 port 請使用：
```
make server PORT=9000
```

### Commit

#### `make build`
會使用 `browserify` 加入 `envify`, `bundle-collapser/plugin` 編出 `perseus-1.js` 和 `perseus-1.css`。請使用這個生成的 perseus 來 commit。

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for a walkthrough of how some
of the Perseus code works and how to extend it.


## License

[MIT License](http://opensource.org/licenses/MIT)
