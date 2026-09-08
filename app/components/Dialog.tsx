import type { ReactNode } from "react";
import { useEffect } from "react";

type DialogProps = {
	children: ReactNode;
	className?: string;
	isOpen: boolean;
	"aria-label": string;
	onDismiss: () => void;
	leastDestructiveRef?: React.RefObject<HTMLElement | null>;
};

export function Dialog({
	children,
	className,
	isOpen,
	"aria-label": ariaLabel,
	onDismiss,
}: DialogProps) {
	useEffect(() => {
		if (!isOpen) return;

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") onDismiss();
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onDismiss]);

	if (!isOpen) return null;

	return (
		<div className="dialog-overlay" onMouseDown={onDismiss}>
			<div
				className={className}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabel}
				onMouseDown={(event) => event.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
}

export function AlertDialog(props: DialogProps) {
	return <Dialog {...props} />;
}

export function AlertDialogLabel({ children }: { children: ReactNode }) {
	return <div>{children}</div>;
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
	return <div>{children}</div>;
}
