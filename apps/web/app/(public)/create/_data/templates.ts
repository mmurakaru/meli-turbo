export type Template = {
	id: string
	title: string
	prompt: string
	category: 'business' | 'hr' | 'finance' | 'personal'
	previewColumns: { id: string; label: string }[]
	previewRows: Record<string, string>[]
}

export const TEMPLATES: Template[] = [
	{
		id: 'project-tracker',
		title: 'Project Tracker',
		prompt: 'Create a project tracker with task name, assignee, status, priority, and due date columns',
		category: 'business',
		previewColumns: [
			{ id: 'c1', label: 'Task' },
			{ id: 'c2', label: 'Assignee' },
			{ id: 'c3', label: 'Status' },
			{ id: 'c4', label: 'Priority' },
			{ id: 'c5', label: 'Due Date' },
		],
		previewRows: [
			{ c1: 'Design mockups', c2: 'Alice', c3: 'In Progress', c4: 'High', c5: 'Mar 20' },
			{ c1: 'API integration', c2: 'Bob', c3: 'Todo', c4: 'Medium', c5: 'Mar 25' },
			{ c1: 'QA testing', c2: 'Carol', c3: 'Todo', c4: 'Low', c5: 'Apr 1' },
		],
	},
	{
		id: 'crm',
		title: 'CRM Pipeline',
		prompt: 'Create a CRM pipeline with company name, contact, deal stage, deal value, and close date',
		category: 'business',
		previewColumns: [
			{ id: 'c1', label: 'Company' },
			{ id: 'c2', label: 'Contact' },
			{ id: 'c3', label: 'Stage' },
			{ id: 'c4', label: 'Value' },
			{ id: 'c5', label: 'Close Date' },
		],
		previewRows: [
			{ c1: 'Acme Corp', c2: 'John Smith', c3: 'Proposal', c4: '$12,000', c5: 'Apr 15' },
			{ c1: 'TechStart', c2: 'Jane Lee', c3: 'Demo', c4: '$8,500', c5: 'Mar 30' },
			{ c1: 'BuildCo', c2: 'Mike Brown', c3: 'Lead', c4: '$5,000', c5: 'May 1' },
		],
	},
	{
		id: 'employee-directory',
		title: 'Employee Directory',
		prompt: 'Create an employee directory with name, department, role, email, and start date',
		category: 'hr',
		previewColumns: [
			{ id: 'c1', label: 'Name' },
			{ id: 'c2', label: 'Department' },
			{ id: 'c3', label: 'Role' },
			{ id: 'c4', label: 'Email' },
			{ id: 'c5', label: 'Start Date' },
		],
		previewRows: [
			{ c1: 'Alice Johnson', c2: 'Engineering', c3: 'Senior Dev', c4: 'alice@co.com', c5: 'Jan 2022' },
			{ c1: 'Bob Williams', c2: 'Marketing', c3: 'Manager', c4: 'bob@co.com', c5: 'Mar 2021' },
			{ c1: 'Carol Davis', c2: 'Design', c3: 'Lead', c4: 'carol@co.com', c5: 'Jun 2023' },
		],
	},
	{
		id: 'budget-tracker',
		title: 'Budget Tracker',
		prompt: 'Create a monthly budget tracker with category, budgeted amount, actual spend, and variance',
		category: 'finance',
		previewColumns: [
			{ id: 'c1', label: 'Category' },
			{ id: 'c2', label: 'Budgeted' },
			{ id: 'c3', label: 'Actual' },
			{ id: 'c4', label: 'Variance' },
		],
		previewRows: [
			{ c1: 'Marketing', c2: '$5,000', c3: '$4,200', c4: '+$800' },
			{ c1: 'Engineering', c2: '$20,000', c3: '$21,500', c4: '-$1,500' },
			{ c1: 'Operations', c2: '$8,000', c3: '$7,800', c4: '+$200' },
		],
	},
	{
		id: 'content-calendar',
		title: 'Content Calendar',
		prompt: 'Create a content calendar with post title, platform, publish date, status, and author',
		category: 'business',
		previewColumns: [
			{ id: 'c1', label: 'Title' },
			{ id: 'c2', label: 'Platform' },
			{ id: 'c3', label: 'Publish Date' },
			{ id: 'c4', label: 'Status' },
		],
		previewRows: [
			{ c1: 'Q1 Product Launch', c2: 'Twitter', c3: 'Mar 15', c4: 'Scheduled' },
			{ c1: 'Feature Spotlight', c2: 'LinkedIn', c3: 'Mar 18', c4: 'Draft' },
			{ c1: 'Customer Story', c2: 'Blog', c3: 'Mar 22', c4: 'In Review' },
		],
	},
	{
		id: 'job-applications',
		title: 'Job Application Tracker',
		prompt: 'Create a job application tracker with company, role, application date, status, and next steps',
		category: 'personal',
		previewColumns: [
			{ id: 'c1', label: 'Company' },
			{ id: 'c2', label: 'Role' },
			{ id: 'c3', label: 'Applied' },
			{ id: 'c4', label: 'Status' },
		],
		previewRows: [
			{ c1: 'Stripe', c2: 'Eng Manager', c3: 'Mar 1', c4: 'Phone Screen' },
			{ c1: 'Linear', c2: 'Sr Engineer', c3: 'Mar 5', c4: 'Applied' },
			{ c1: 'Vercel', c2: 'Staff Eng', c3: 'Mar 8', c4: 'Interview' },
		],
	},
	{
		id: 'invoice-tracker',
		title: 'Invoice Tracker',
		prompt: 'Create an invoice tracker with client name, invoice number, amount, due date, and payment status',
		category: 'finance',
		previewColumns: [
			{ id: 'c1', label: 'Client' },
			{ id: 'c2', label: 'Invoice #' },
			{ id: 'c3', label: 'Amount' },
			{ id: 'c4', label: 'Due Date' },
			{ id: 'c5', label: 'Status' },
		],
		previewRows: [
			{ c1: 'Acme Corp', c2: 'INV-001', c3: '$3,200', c4: 'Mar 20', c5: 'Pending' },
			{ c1: 'TechStart', c2: 'INV-002', c3: '$1,800', c4: 'Mar 15', c5: 'Paid' },
			{ c1: 'BuildCo', c2: 'INV-003', c3: '$5,000', c4: 'Apr 1', c5: 'Overdue' },
		],
	},
	{
		id: 'onboarding',
		title: 'Onboarding Checklist',
		prompt: 'Create an employee onboarding checklist with task, owner, due date, and completion status',
		category: 'hr',
		previewColumns: [
			{ id: 'c1', label: 'Task' },
			{ id: 'c2', label: 'Owner' },
			{ id: 'c3', label: 'Due' },
			{ id: 'c4', label: 'Done' },
		],
		previewRows: [
			{ c1: 'Set up laptop', c2: 'IT', c3: 'Day 1', c4: '✓' },
			{ c1: 'Team intro', c2: 'Manager', c3: 'Day 1', c4: '✓' },
			{ c1: 'Complete training', c2: 'HR', c3: 'Week 1', c4: '' },
		],
	},
]
