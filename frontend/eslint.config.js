import globals from 'globals';
export default [{ignores:['dist','coverage']},{files:['src/**/*.{js,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser,...globals.jest}},rules:{'no-unused-vars':['error',{varsIgnorePattern:'^[A-Z_]',argsIgnorePattern:'^_'}],'no-undef':'error','no-unreachable':'error'}}];
