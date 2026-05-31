const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

// A precise lexical tokenizer for JSX that tracks tag names, open/close, self-closing, braces, and strings.
let openTags = [];
let i = 0;

// Helper to check if a name is a valid JSX identifier
function isJSXIdentifier(char) {
  return /[a-zA-Z0-9\._\-:]/.test(char);
}

// We will scan the entire file to build the JSX AST/hierarchy
while (i < code.length) {
  // Skip block comments
  if (code.startsWith('/*', i)) {
    i = code.indexOf('*/', i) + 2;
    continue;
  }
  // Skip line comments
  if (code.startsWith('//', i)) {
    i = code.indexOf('\n', i) + 1;
    continue;
  }
  // Skip string literals (single/double quotes)
  if (code[i] === '"' || code[i] === "'") {
    let char = code[i];
    i++;
    while (i < code.length && code[i] !== char) {
      if (code[i] === '\\') i++;
      i++;
    }
    i++;
    continue;
  }
  // Skip template literals
  if (code[i] === '`') {
    i++;
    while (i < code.length && code[i] !== '`') {
      if (code[i] === '\\') i++;
      i++;
    }
    i++;
    continue;
  }

  // Detect JSX tags
  if (code[i] === '<') {
    // Avoid comments, standard comparison operators (like a < b), generics, etc.
    let nextChar = code[i + 1];
    if (nextChar === '/' || /[a-zA-Z_]/.test(nextChar)) {
      // Parse tag name
      let isClose = nextChar === '/';
      let nameStart = isClose ? i + 2 : i + 1;
      let nameEnd = nameStart;
      while (nameEnd < code.length && isJSXIdentifier(code[nameEnd])) {
        nameEnd++;
      }
      let tagName = code.substring(nameStart, nameEnd);
      
      // Let's filter out obviously non-JSX tokens (like TypeScript types in generics or comparisons)
      // e.g. <SpelledLetter> inside code can be a generic, but let's check if it closes with `>`
      let tagEnd = nameEnd;
      let isSelfClosing = false;
      let bracesCount = 0;
      let isValidTag = false;
      
      while (tagEnd < code.length) {
        if (code[tagEnd] === '{') bracesCount++;
        if (code[tagEnd] === '}') bracesCount--;
        
        if (bracesCount === 0) {
          if (code[tagEnd] === '>') {
            if (code[tagEnd - 1] === '/') {
              isSelfClosing = true;
            }
            isValidTag = true;
            break;
          }
        }
        tagEnd++;
      }

      if (isValidTag && tagName && /^[A-Z_a-z]/.test(tagName)) {
        // Find line number
        let lineNum = code.substring(0, i).split('\n').length;
        
        if (!isSelfClosing) {
          if (isClose) {
            let lastIdx = openTags.map(t => t.name).lastIndexOf(tagName);
            if (lastIdx !== -1) {
              openTags = openTags.slice(0, lastIdx);
            }
          } else {
            openTags.push({ name: tagName, line: lineNum });
          }
        }
        
        if (lineNum >= 5560 && lineNum <= 5580) {
          console.log(`Line ${lineNum}: <${isClose ? '/' : ''}${tagName}> (stack: ${openTags.map(t => `${t.name}:${t.line}`).join(' -> ')})`);
        }
        
        i = tagEnd + 1;
        continue;
      }
    }
  }
  
  i++;
}
