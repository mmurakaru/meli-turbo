import { Skeleton } from '@workspace/ui/components/skeleton'

export default function Loading() {
	return (
		<section>
			<div className="px-3 py-1 h-9">
				<Skeleton className="h-7 w-[250px]" />
			</div>
			<div className="px-3 py-1 h-9">
				<Skeleton className="h-5 w-[200px]" />
			</div>
		</section>
	)
}
