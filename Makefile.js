import { task, desc, sh } from 'make-js';

desc('Installation des dépendances');
task('install', [], async () => {
  await sh('pnpm install');
});

desc('Démarrage en mode développement');
task('dev', [], async () => {
  await sh('pnpm nodemon src/index.js');
});

desc('Démarrage en mode production');
task('start', [], async () => {
  await sh('pnpm node src/index.js');
});

desc('Lancement des tests');
task('test', [], async () => {
  await sh('pnpm jest');
});

desc('Vérification du linting');
task('lint', [], async () => {
  await sh('pnpm eslint src/**/*.js');
});

desc('Build du projet');
task('build', ['lint', 'test'], async () => {
  console.log('Build completed!');
});
