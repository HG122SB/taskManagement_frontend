 import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

const Column = ({ column, tasks }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg w-64">
      <h2 className="font-bold mb-4">{column.title}</h2>

      <Droppable droppableId={column.id}>
        {(provided) => (
          <div
            className="space-y-2"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    className="p-3 bg-white rounded shadow"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {task.content}
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
