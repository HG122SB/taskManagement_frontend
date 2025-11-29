import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const initialData = {
  boards: [
    {
      id: 'board-1',
      title: 'Project Board',
      color: 'bg-blue-500',
      columns: [
        {
          id: 'column-1',
          title: 'To Do',
          color: 'bg-red-500',
          taskIds: ['task-1', 'task-2'],
        },
        {
          id: 'column-2',
          title: 'In Progress',
          color: 'bg-yellow-500',
          taskIds: ['task-3'],
        },
        {
          id: 'column-3',
          title: 'Done',
          color: 'bg-green-500',
          taskIds: [],
        },
      ],
      tasks: {
        'task-1': { id: 'task-1', content: 'Take out the garbage', label: 'urgent', dueDate: '2025-11-25', color: 'bg-red-200' },
        'task-2': { id: 'task-2', content: 'Watch my favorite show', label: 'fun', dueDate: '', color: 'bg-purple-200' },
        'task-3': { id: 'task-3', content: 'Charge my phone', label: 'tech', dueDate: '2025-11-23', color: 'bg-blue-200' },
      },
    },
    {
      id: 'board-2',
      title: 'Personal Board',
      color: 'bg-purple-500',
      columns: [
        {
          id: 'column-4',
          title: 'Ideas',
          color: 'bg-indigo-500',
          taskIds: [],
        },
        {
          id: 'column-5',
          title: 'To Do',
          color: 'bg-orange-500',
          taskIds: [],
        },
      ],
      tasks: {},
    },
  ],
};

const getRandomColor = () => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomTaskColor = () => {
  const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-orange-200'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const App = () => {
  const [data, setData] = useState(initialData);
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('trelloData');
    const savedTheme = localStorage.getItem('trelloTheme');
    if (saved) setData(JSON.parse(saved));
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('trelloData', JSON.stringify(data));
    localStorage.setItem('trelloTheme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [data, theme]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Extract boardId from droppableId (for tasks: columnId, for columns: board-droppable)
    const sourceBoardId = source.droppableId.startsWith('board-') ? source.droppableId.replace('board-', '') : source.droppableId.split('-')[1];
    const destBoardId = destination.droppableId.startsWith('board-') ? destination.droppableId.replace('board-', '') : destination.droppableId.split('-')[1];

    // For cross-board drag, use sourceBoardId for simplicity; extend if needed
    const boardId = sourceBoardId || destBoardId;
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) return;
    const board = { ...data.boards[boardIndex] };

    if (type === 'column') {
      const newColumnOrder = Array.from(board.columns);
      const [removed] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, removed);
      const newData = {
        ...data,
        boards: [...data.boards.slice(0, boardIndex), { ...board, columns: newColumnOrder }, ...data.boards.slice(boardIndex + 1)],
      };
      setData(newData);
      return;
    }

    const start = board.columns.find(col => col.id === source.droppableId);
    const finish = board.columns.find(col => col.id === destination.droppableId);

    if (!start || !finish) return;

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      const [removed] = newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, removed);
      const newColumn = { ...start, taskIds: newTaskIds };
      const newColumns = board.columns.map(col => (col.id === newColumn.id ? newColumn : col));
      const newData = {
        ...data,
        boards: [...data.boards.slice(0, boardIndex), { ...board, columns: newColumns }, ...data.boards.slice(boardIndex + 1)],
      };
      setData(newData);
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    const [removed] = startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const destTaskIds = Array.from(finish.taskIds);
    destTaskIds.splice(destination.index, 0, removed);
    const newFinish = { ...finish, taskIds: destTaskIds };

    const newColumns = board.columns.map(col => {
      if (col.id === start.id) return newStart;
      if (col.id === finish.id) return newFinish;
      return col;
    });

    const newData = {
      ...data,
      boards: [...data.boards.slice(0, boardIndex), { ...board, columns: newColumns }, ...data.boards.slice(boardIndex + 1)],
    };
    setData(newData);
  };

  const addBoard = () => {
    const newBoardId = `board-${Date.now()}`;
    const newBoard = {
      id: newBoardId,
      title: `New Board`,
      color: getRandomColor(),
      columns: [{ id: `column-${Date.now()}`, title: 'To Do', color: getRandomColor(), taskIds: [] }],
      tasks: {},
    };
    setData({ ...data, boards: [...data.boards, newBoard] });
  };

  const deleteBoard = (boardId) => {
    setData({ ...data, boards: data.boards.filter(b => b.id !== boardId) });
  };

  const updateBoardTitle = (boardId, newTitle) => {
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    const newBoards = data.boards.map((b, i) => i === boardIndex ? { ...b, title: newTitle } : b);
    setData({ ...data, boards: newBoards });
  };

  const addColumn = (boardId) => {
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    const board = { ...data.boards[boardIndex] };
    const newColumnId = `column-${Date.now()}`;
    const newColumn = { id: newColumnId, title: 'New Column', color: getRandomColor(), taskIds: [] };
    const newBoards = [
      ...data.boards.slice(0, boardIndex),
      { ...board, columns: [...board.columns, newColumn] },
      ...data.boards.slice(boardIndex + 1),
    ];
    setData({ ...data, boards: newBoards });
  };

  const deleteColumn = (columnId, boardId) => {
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    const board = { ...data.boards[boardIndex] };
    const newColumns = board.columns.filter(c => c.id !== columnId);
    // Move tasks to archive or delete; here, just remove
    const newBoards = [
      ...data.boards.slice(0, boardIndex),
      { ...board, columns: newColumns },
      ...data.boards.slice(boardIndex + 1),
    ];
    setData({ ...data, boards: newBoards });
  };

  const updateColumnTitle = (columnId, boardId, newTitle) => {
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    const board = { ...data.boards[boardIndex] };
    const newColumns = board.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c);
    const newBoards = [
      ...data.boards.slice(0, boardIndex),
      { ...board, columns: newColumns },
      ...data.boards.slice(boardIndex + 1),
    ];
    setData({ ...data, boards: newBoards });
  };

  const addTask = (columnId, boardId) => {
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    const board = { ...data.boards[boardIndex] };
    const newTaskId = `task-${Date.now()}`;
    const newTask = { id: newTaskId, content: 'New Task', label: '', dueDate: '', color: getRandomTaskColor() };
    const columnIndex = board.columns.findIndex(c => c.id === columnId);
    const column = { ...board.columns[columnIndex] };
    const newTaskIds = [...column.taskIds, newTaskId];
    const newColumn = { ...column, taskIds: newTaskIds };
    const newColumns = board.columns.map((col, idx) => (idx === columnIndex ? newColumn : col));
    const newBoard = { ...board, columns: newColumns, tasks: { ...board.tasks, [newTaskId]: newTask } };
    const newBoards = [
      ...data.boards.slice(0, boardIndex),
      newBoard,
      ...data.boards.slice(boardIndex + 1),
    ];
    setData({ ...data, boards: newBoards });
  };

  const updateTask = (taskId, boardId, updates) => {
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    const board = { ...data.boards[boardIndex] };
    board.tasks[taskId] = { ...board.tasks[taskId], ...updates };
    const newBoards = [
      ...data.boards.slice(0, boardIndex),
      board,
      ...data.boards.slice(boardIndex + 1),
    ];
    setData({ ...data, boards: newBoards });
  };

  const deleteTask = (taskId, boardId) => {
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    const board = { ...data.boards[boardIndex] };
    const columnId = board.columns.find(col => col.taskIds.includes(taskId))?.id;
    if (columnId) {
      const columnIndex = board.columns.findIndex(c => c.id === columnId);
      const column = { ...board.columns[columnIndex] };
      const newTaskIds = column.taskIds.filter(id => id !== taskId);
      const newColumn = { ...column, taskIds: newTaskIds };
      const newColumns = board.columns.map((col, idx) => (idx === columnIndex ? newColumn : col));
      const { [taskId]: _, ...newTasks } = board.tasks;
      const newBoard = { ...board, columns: newColumns, tasks: newTasks };
      const newBoards = [
        ...data.boards.slice(0, boardIndex),
        newBoard,
        ...data.boards.slice(boardIndex + 1),
      ];
      setData({ ...data, boards: newBoards });
    }
  };

  const filteredBoards = data.boards.map(board => ({
    ...board,
    columns: board.columns.map(col => ({
      ...col,
      taskIds: col.taskIds.filter(taskId => {
        const task = board.tasks[taskId];
        return task && task.content.toLowerCase().includes(searchQuery.toLowerCase());
      }),
    })),
  }));

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `trello-clone-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          setData(importedData);
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`${theme} min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 p-2 sm:p-4 lg:p-6`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200">Task management app (trello)</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 lg:flex-none"
          />
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm sm:text-base"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={exportData} className="bg-green-500 hover:bg-green-700 text-white px-3 py-2 rounded text-sm sm:text-base">Export</button>
          <label className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded cursor-pointer text-sm sm:text-base">
            Import
            <input type="file" onChange={importData} className="hidden" accept=".json" />
          </label>
        </div>
      </div>
      <button
        onClick={addBoard}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded mb-4 shadow-lg text-sm sm:text-base"
      >
        Add Board
      </button>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 overflow-x-auto pb-4 lg:overflow-visible">
          {filteredBoards.map((board) => (
            <div key={board.id} className={`${board.color} text-white rounded-lg shadow-xl p-2 sm:p-4 min-w-full sm:min-w-[280px] lg:min-w-[300px] flex-1 max-w-full sm:max-w-sm lg:max-w-md xl:max-w-lg relative h-auto sm:h-[80vh] lg:h-auto`}>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <input
                  type="text"
                  value={board.title}
                  onChange={(e) => updateBoardTitle(board.id, e.target.value)}
                  className="bg-transparent border-b border-white/50 text-white font-semibold text-base sm:text-lg w-full focus:outline-none focus:border-b-white"
                />
                <button
                  onClick={() => deleteBoard(board.id)}
                  className="text-red-200 hover:text-red-400 text-lg sm:text-xl ml-2"
                >
                  ×
                </button>
              </div>
              <button
                onClick={() => addColumn(board.id)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs sm:text-sm mb-2 sm:mb-3 w-full"
              >
                Add Column
              </button>
              <Droppable droppableId={`board-${board.id}`} type="column" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-row gap-2 sm:gap-4 overflow-x-auto overflow-y-hidden pb-2 sm:pb-4 pr-2 h-auto sm:h-[calc(80vh-200px)] lg:h-auto lg:flex-col lg:gap-4 lg:overflow-y-auto lg:overflow-x-visible lg:pr-0"
                  >
                    {board.columns.map((column, index) => (
                      <div key={column.id} className={`${column.color} text-white rounded p-2 sm:p-3 min-w-[220px] sm:min-w-[250px] flex flex-col flex-shrink-0 lg:flex-shrink`}>
                        <div className="flex justify-between items-center mb-1 sm:mb-2">
                          <input
                            type="text"
                            value={column.title}
                            onChange={(e) => updateColumnTitle(column.id, board.id, e.target.value)}
                            className="bg-transparent border-b border-white/50 text-white font-medium text-sm sm:text-base w-full focus:outline-none focus:border-b-white"
                          />
                          <button
                            onClick={() => deleteColumn(column.id, board.id)}
                            className="text-red-200 hover:text-red-400 text-lg sm:text-xl ml-1 sm:ml-2"
                          >
                            ×
                          </button>
                        </div>
                        <button
                          onClick={() => addTask(column.id, board.id)}
                          className="bg-white/20 hover:bg-white/30 text-white text-xs py-1 px-2 rounded mb-2 self-start"
                        >
                          Add Task
                        </button>
                        <Droppable droppableId={column.id} type="task">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 min-h-[40px] sm:min-h-[50px] rounded p-1 sm:p-2 ${snapshot.isDraggingOver ? 'bg-white/20' : ''}`}
                            >
                              {column.taskIds.map((taskId, idx) => {
                                const task = board.tasks[taskId];
                                if (!task) return null;
                                return (
                                  <Draggable key={task.id} draggableId={task.id} index={idx}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white/10 dark:bg-gray-800/50 p-2 sm:p-3 mb-1 sm:mb-2 rounded shadow-md border border-white/20 cursor-move touch-manipulation ${
                                          snapshot.isDragging ? 'shadow-2xl scale-105' : ''
                                        }`}
                                      >
                                        <textarea
                                          value={task.content}
                                          onChange={(e) => updateTask(task.id, board.id, { content: e.target.value })}
                                          className="w-full p-1 text-xs sm:text-sm resize-none bg-transparent text-white focus:outline-none"
                                          rows={2}
                                        />
                                        <div className="flex flex-wrap justify-between items-center mt-1 sm:mt-2 text-xs gap-1">
                                          {task.label && (
                                            <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${task.color} text-black font-medium text-xs`}>
                                              {task.label}
                                            </span>
                                          )}
                                          {task.dueDate && <span className="text-gray-200 text-xs sm:text-sm">{task.dueDate}</span>}
                                          <input
                                            type="date"
                                            value={task.dueDate}
                                            onChange={(e) => updateTask(task.id, board.id, { dueDate: e.target.value })}
                                            className="bg-transparent text-white border border-white/30 rounded text-xs px-1 py-0.5 sm:px-2 sm:py-1 flex-1 min-w-[100px]"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          placeholder="Label"
                                          value={task.label}
                                          onChange={(e) => updateTask(task.id, board.id, { label: e.target.value, color: getRandomTaskColor() })}
                                          className="w-full mt-1 p-1 text-xs bg-transparent border border-white/30 rounded text-white"
                                        />
                                        <button
                                          onClick={() => deleteTask(task.id, board.id)}
                                          className="text-red-200 hover:text-red-400 text-xs mt-1 w-full text-left"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default App;