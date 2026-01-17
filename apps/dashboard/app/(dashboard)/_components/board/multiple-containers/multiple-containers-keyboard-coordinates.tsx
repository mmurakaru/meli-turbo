import {
	closestCorners,
	type DroppableContainer,
	getFirstCollision,
	KeyboardCode,
	type KeyboardCoordinateGetter,
} from '@dnd-kit/core'

const directions: string[] = [
	KeyboardCode.Down,
	KeyboardCode.Right,
	KeyboardCode.Up,
	KeyboardCode.Left,
]

function shouldSkipContainer(entry: DroppableContainer, activeType: string | undefined) {
	if (entry.disabled) {
		return true
	}

	const data = entry.data.current

	if (!data) {
		return false
	}

	const { type, children } = data

	if (type === 'container' && children?.length > 0 && activeType !== 'container') {
		return true
	}

	return false
}

function isMovingToward(code: string, collisionRect: DOMRect, targetRect: DOMRect): boolean {
	switch (code) {
		case KeyboardCode.Down:
			return collisionRect.top < targetRect.top
		case KeyboardCode.Up:
			return collisionRect.top > targetRect.top
		case KeyboardCode.Left:
			return collisionRect.left >= targetRect.left + targetRect.width
		case KeyboardCode.Right:
			return collisionRect.left + collisionRect.width <= targetRect.left
		default:
			return false
	}
}

export const coordinateGetter: KeyboardCoordinateGetter = (
	event,
	{ context: { active, droppableRects, droppableContainers, collisionRect } },
) => {
	if (directions.includes(event.code)) {
		event.preventDefault()

		if (!active || !collisionRect) {
			return
		}

		const activeType = active.data.current?.type
		const filteredContainers = droppableContainers.getEnabled().filter((entry) => {
			if (!entry) {
				return false
			}

			const rect = droppableRects.get(entry.id)

			if (!rect || shouldSkipContainer(entry, activeType)) {
				return false
			}

			return isMovingToward(event.code, collisionRect, rect)
		})

		const collisions = closestCorners({
			active,
			collisionRect,
			droppableRects,
			droppableContainers: filteredContainers,
			pointerCoordinates: null,
		})
		const closestId = getFirstCollision(collisions, 'id')

		if (closestId != null) {
			const newDroppable = droppableContainers.get(closestId)
			const newNode = newDroppable?.node.current
			const newRect = newDroppable?.rect.current

			if (newNode && newRect) {
				if (newDroppable.id === 'placeholder') {
					return {
						x: newRect.left + (newRect.width - collisionRect.width) / 2,
						y: newRect.top + (newRect.height - collisionRect.height) / 2,
					}
				}

				if (newDroppable.data.current?.type === 'container') {
					return {
						x: newRect.left + 20,
						y: newRect.top + 74,
					}
				}

				return {
					x: newRect.left,
					y: newRect.top,
				}
			}
		}
	}

	return undefined
}
