import type { Todo } from "@acme/zen-v3/zenstack/models";
import { useState } from "react";

import { TodoItem } from "./todo-item";

export function TodoList({ todos }: { todos: Todo[] }) {
	const [todoDeleted, setTodoDeleted] = useState<Todo | null>(null);

	return (
		<div>
			<p>Total todos: {todos.length}</p>
			{todos.map((todo) => (
				<TodoItem
					key={todo.id}
					todo={todo}
					todoDeleted={todoDeleted}
					onDeleted={setTodoDeleted}
				/>
			))}
		</div>
	);
}
