const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf8');

code = code.replace(
  /const \[formData, setFormData\] = useState\(\{/g,
  `const [formData, setFormData] = useState({
    contact: '',`
);

// We should use multi_edit_file!
