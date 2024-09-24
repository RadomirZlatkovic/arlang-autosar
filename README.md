# Quick demo

https://github.com/user-attachments/assets/37538af4-45fa-4971-90db-7e08a2b04d40

# Developer guide

## Build
  - Install Node.js
  - Position terminal inside this directory
  - Execute following commands:
    - npm install *(this will install dependencies into node_modules)*
    - npm run langium:generate *(this will generate files from arlang.langium file)*
    - npm run build
    - npm run bundle *(optional - this will reduce the size of the extension and make it faster)*

## Try
  - Press F5 *(it will open new VSCode instance with included extension*)
  - You can create file with .arlang extension and start writing code

## Optional
  - if you want to try language in the web:
    - npm run bundle:serve // this will show ip address with port, open it in the browser
