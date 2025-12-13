import type { Test } from "@acme/zen-v3/zenstack/models";

import { TestItem } from "./test-item";

export function TestList({ tests }: { tests: Test[] }) {
	return (
		<div>
			<p>Total tests: {tests.length}</p>
			{tests.map((test) => (
				<TestItem key={test.id} test={test} />
			))}
		</div>
	);
}
