export const SNAKE_TEMPLATE = `() => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [dir, setDir] = useState({ x: 0, y: -1 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(150);

  useEffect(() => {
    if (gameOver) return;
    const handleKey = (e) => {
      switch(e.key) {
        case 'ArrowUp': if (dir.y === 0) setDir({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (dir.y === 0) setDir({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (dir.x === 0) setDir({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (dir.x === 0) setDir({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    const interval = setInterval(() => moveSnake(), speed);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearInterval(interval);
    };
  }, [snake, dir, gameOver, speed]);

  const moveSnake = () => {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || 
        snake.some(s => s.x === head.x && s.y === head.y)) {
      setGameOver(true);
      return;
    }
    const newSnake = [head, ...snake];
    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + 10);
      setFood({ x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20) });
      setSpeed(s => Math.max(50, s - 2));
    } else {
      newSnake.pop();
    }
    setSnake(newSnake);
  };

  const reset = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDir({ x: 0, y: -1 });
    setScore(0);
    setGameOver(false);
    setSpeed(150);
  };

  return html\`
    <div style={{ background: '#0f172a', color: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h3>Gaia Snake</h3>
      <div style={{ margin: '10px 0', fontSize: '1.2rem', color: '#38bdf8' }}>Score: \${score}</div>
      <div style={{ position: 'relative', width: '200px', height: '200px', background: '#1e293b', margin: '0 auto', border: '1px solid #334155' }}>
        {snake.map((s, i) => html\`
          <div key={i} style={{ 
            position: 'absolute', 
            width: '10px', 
            height: '10px', 
            background: i === 0 ? '#38bdf8' : '#0ea5e9', 
            left: s.x * 10, 
            top: s.y * 10,
            borderRadius: '2px'
          }} />
        \`)}
        <div style={{ 
          position: 'absolute', 
          width: '10px', 
          height: '10px', 
          background: '#fb7185', 
          left: food.x * 10, 
          top: food.y * 10,
          borderRadius: '50%'
        }} />
        {gameOver && html\`
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'grid', placeItems: 'center' }}>
            <div style={{ padding: '20px' }}>
              <h4 style={{ color: '#fb7185' }}>GAME OVER</h4>
              <button onClick={reset} style={{ background: '#38bdf8', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Restart</button>
            </div>
          </div>
        \`}
      </div>
      <p style={{ fontSize: '10px', marginTop: '10px', opacity: 0.6 }}>Use arrow keys to move.</p>
    </div>
  \`;
}\`;

export const KANBAN_TEMPLATE = \`() => {
  const [cols, setCols] = useState({
    todo: ['Research API', 'Fix CSS'],
    doing: ['Build sandbox'],
    done: ['Init project']
  });

  const move = (task, from, to) => {
    setCols(current => ({
      ...current,
      [from]: current[from].filter(t => t !== task),
      [to]: [...current[to], task]
    }));
  };

  return html\`
    <div style={{ display: 'flex', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', minHeight: '300px' }}>
      {Object.entries(cols).map(([name, tasks]) => html\`
        <div key={name} style={{ flex: 1, background: '#f1f5f9', p: '8px', borderRadius: '4px' }}>
          <h4 style={{ textTransform: 'uppercase', fontSize: '12px', marginBottom: '8px' }}>{name}</h4>
          {tasks.map(task => html\`
            <div key={task} style={{ background: '#fff', p: '8px', marginBottom: '4px', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '11px' }}>
              {task}
              <div style={{ marginTop: '4px', display: 'flex', gap: '2px' }}>
                {name !== 'todo' && html\`<button onClick={() => move(task, name, name === 'done' ? 'doing' : 'todo')} style={{ fontSize: '9px' }}>⬅️</button>\`}
                {name !== 'done' && html\`<button onClick={() => move(task, name, name === 'todo' ? 'doing' : 'done')} style={{ fontSize: '9px' }}>➡️</button>\`}
              </div>
            </div>
          \`)}
        </div>
      \`)}
    </div>
  \`;
}\`;

export const VISUALIZER_TEMPLATE = \`() => {
  const data = [45, 80, 55, 90, 70, 40, 60, 85];
  return html\`
    <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h3>Performance Metrics</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '150px', borderLeft: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', padding: '10px' }}>
        {data.map((h, i) => html\`
          <div key={i} style={{ 
            flex: 1, 
            height: \\\`\\\${h}%\\\`, 
            background: 'linear-gradient(to top, #38bdf8, #818cf8)', 
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.3s ease'
          }} />
        \`)}
      </div>
      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>Live data visualization generated in Sandbox.</p>
    </div>
  \`;
}\`;
