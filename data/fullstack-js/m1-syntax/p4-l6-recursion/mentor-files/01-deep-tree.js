// Блок 1: обход простого дерева

const tree = {
  name: 'root',
  children: [
    {
      name: 'src',
      children: [
        { name: 'index.js', children: [] },
        { name: 'utils.js', children: [] },
      ],
    },
    { name: 'tests', children: [{ name: 'utils.test.js', children: [] }] },
    { name: 'README.md', children: [] },
  ],
};

let depth = 0;

function printTree(node, indent) {
  depth++;
  console.log(indent + node.name + '  (глубина рекурсии: ' + depth + ')');
  for (const child of node.children) {
    printTree(child, indent + '  ');
  }
  depth--;
}

printTree(tree, '');
console.log('');

// ============================================================

// Блок 2: обход глубокого дерева (4 уровня)

const deepTree = {
  name: 'a',
  children: [
    {
      name: 'b',
      children: [
        {
          name: 'c',
          children: [
            {
              name: 'd',
              children: [
                {
                  name: 'e',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

depth = 0;
printTree(deepTree, '');

console.log('');

// ============================================================

// Блок 3: стек вызовов — ошибка при глубокой рекурсии
let count = 0;

function recurse(n) {
  if (n <= 0) return;
  count++;
  recurse(n - 1);
}

console.log('100 вызовов — ок');
recurse(100);
console.log('1000 вызовов — ок');
recurse(1000);
console.log('10000 вызовов — ок');
recurse(10000);
console.log('15000 вызовов — в bun ок');
recurse(15000);
try {
  console.log('150000 вызовов — сейчас будет ошибка переполнения стека...');
  recurse(150000);
} catch (e) {
  console.log('Вызовов было:', count);
  throw e;
}
