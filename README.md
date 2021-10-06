# @csvbox/csvboxjs

> JS adapter for csvbox.io

[![NPM](https://img.shields.io/npm/v/@csvbox/csvboxjs.svg)](https://www.npmjs.com/package/@csvbox/csvboxjs) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Shell

```bash
npm install @csvbox/csvboxjs
```

## Usage

```jsx
import CSVBoxImporter from '@csvbox/csvboxjs';

function callback(result, data) {
    if(result) {
        console.log("Sheet uploaded successfully");
        console.log(data.row_success + " rows uploaded");
    }else{
        console.log("There was some problem uploading the sheet");
    }
}

let importer = new CSVBoxImporter("38uZ5obLvII2vyPYqKNjRe4iCJ6fTJ",{}, callback);

importer.setUser({
    user_id: 'default123'
});

importer.openModal();
```

## Readme

For usage see the guide here - https://help.csvbox.io/getting-started#2-install-code


## License

MIT © [csvbox-io](https://github.com/csvbox-io)