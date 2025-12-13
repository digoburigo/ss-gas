"use client";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
// @ts-nocheck
/* eslint-disable */
import Image from "@tiptap/extension-image";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Edit,
	ImageIcon,
	Loader2,
	Maximize,
	MoreVertical,
	Trash,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useImageUpload } from "../../../hooks/use-image-upload";

export const ImageExtension = Image.extend({
	addAttributes() {
		return {
			src: {
				default: null,
			},
			alt: {
				default: null,
			},
			title: {
				default: null,
			},
			width: {
				default: "100%",
			},
			height: {
				default: null,
			},
			align: {
				default: "center",
			},
			caption: {
				default: "",
			},
			aspectRatio: {
				default: null,
			},
		};
	},

	addNodeView: () => ReactNodeViewRenderer(TiptapImage),
});

function TiptapImage(props: NodeViewProps) {
	const { node, editor, selected, deleteNode, updateAttributes } = props;
	const imageRef = useRef<HTMLImageElement | null>(null);
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const [resizing, setResizing] = useState(false);
	const [resizingPosition, setResizingPosition] = useState<"left" | "right">(
		"left",
	);
	const [resizeInitialWidth, setResizeInitialWidth] = useState(0);
	const [resizeInitialMouseX, setResizeInitialMouseX] = useState(0);
	const [editingCaption, setEditingCaption] = useState(false);
	const [caption, setCaption] = useState(node.attrs.caption || "");
	const [openedMore, setOpenedMore] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [altText, setAltText] = useState(node.attrs.alt || "");

	const {
		previewUrl,
		fileInputRef,
		handleFileChange,
		handleRemove,
		uploading,
		error,
	} = useImageUpload({
		onUpload: (imageUrl) => {
			updateAttributes({
				src: imageUrl,
				alt: altText || fileInputRef.current?.files?.[0]?.name,
			});
			handleRemove();
			setOpenedMore(false);
		},
	});

	function handleResizingPosition({
		e,
		position,
	}: {
		e: React.MouseEvent<HTMLDivElement, MouseEvent>;
		position: "left" | "right";
	}) {
		startResize(e);
		setResizingPosition(position);
	}

	function startResize(event: React.MouseEvent<HTMLDivElement>) {
		event.preventDefault();
		setResizing(true);
		setResizeInitialMouseX(event.clientX);
		if (imageRef.current) {
			setResizeInitialWidth(imageRef.current.offsetWidth);
		}
	}

	function resize(event: MouseEvent) {
		if (!resizing) return;

		let dx = event.clientX - resizeInitialMouseX;
		if (resizingPosition === "left") {
			dx = resizeInitialMouseX - event.clientX;
		}

		const newWidth = Math.max(resizeInitialWidth + dx, 150);
		const parentWidth = nodeRef.current?.parentElement?.offsetWidth ?? 0;

		if (newWidth < parentWidth) {
			updateAttributes({
				width: newWidth,
			});
		}
	}

	function endResize() {
		setResizing(false);
		setResizeInitialMouseX(0);
		setResizeInitialWidth(0);
	}

	function handleTouchStart(
		event: React.TouchEvent,
		position: "left" | "right",
	) {
		event.preventDefault();
		setResizing(true);
		setResizingPosition(position);
		setResizeInitialMouseX(event.touches[0]?.clientX ?? 0);
		if (imageRef.current) {
			setResizeInitialWidth(imageRef.current.offsetWidth);
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (!resizing) return;

		let dx =
			(event.touches[0]?.clientX ?? resizeInitialMouseX) - resizeInitialMouseX;
		if (resizingPosition === "left") {
			dx =
				resizeInitialMouseX -
				(event.touches[0]?.clientX ?? resizeInitialMouseX);
		}

		const newWidth = Math.max(resizeInitialWidth + dx, 150);
		const parentWidth = nodeRef.current?.parentElement?.offsetWidth ?? 0;

		if (newWidth < parentWidth) {
			updateAttributes({
				width: newWidth,
			});
		}
	}

	function handleTouchEnd() {
		setResizing(false);
		setResizeInitialMouseX(0);
		setResizeInitialWidth(0);
	}

	function handleCaptionChange(e: React.ChangeEvent<HTMLInputElement>) {
		const newCaption = e.target.value;
		setCaption(newCaption);
	}

	function handleCaptionBlur() {
		updateAttributes({ caption });
		setEditingCaption(false);
	}

	function handleCaptionKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter") {
			handleCaptionBlur();
		}
	}

	const handleImageUrlSubmit = () => {
		if (imageUrl) {
			updateAttributes({
				src: imageUrl,
				alt: altText,
			});
			setImageUrl("");
			setAltText("");
			setOpenedMore(false);
		}
	};

	useEffect(() => {
		window.addEventListener("mousemove", resize);
		window.addEventListener("mouseup", endResize);
		window.addEventListener("touchmove", handleTouchMove);
		window.addEventListener("touchend", handleTouchEnd);
		return () => {
			window.removeEventListener("mousemove", resize);
			window.removeEventListener("mouseup", endResize);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleTouchEnd);
		};
	}, [resizing, resizeInitialMouseX, resizeInitialWidth]);

	return (
		<NodeViewWrapper
			className={cn(
				"relative flex flex-col rounded-md border-2 border-transparent transition-all duration-200",
				selected ? "border-blue-300" : "",
				node.attrs.align === "left" && "left-0 -translate-x-0",
				node.attrs.align === "center" && "left-1/2 -translate-x-1/2",
				node.attrs.align === "right" && "left-full -translate-x-full",
			)}
			ref={nodeRef}
			style={{ width: node.attrs.width }}
		>
			<div
				className={cn(
					"group relative flex flex-col rounded-md",
					resizing && "",
				)}
			>
				<figure className="relative m-0">
					<img
						alt={node.attrs.alt}
						className="rounded-lg transition-shadow duration-200 hover:shadow-lg"
						onLoad={(e) => {
							const img = e.currentTarget;
							const aspectRatio = img.naturalWidth / img.naturalHeight;
							updateAttributes({ aspectRatio });
						}}
						ref={imageRef}
						src={node.attrs.src}
						title={node.attrs.title}
					/>
					{editor?.isEditable && (
						<>
							<div
								className="absolute inset-y-0 z-20 flex w-[25px] cursor-col-resize items-center justify-start p-2"
								onMouseDown={(event) => {
									handleResizingPosition({ e: event, position: "left" });
								}}
								onTouchStart={(event) => handleTouchStart(event, "left")}
								style={{ left: 0 }}
							>
								<div className="z-20 h-[70px] w-1 rounded-xl border bg-[rgba(0,0,0,0.65)] opacity-0 transition-all group-hover:opacity-100" />
							</div>
							<div
								className="absolute inset-y-0 z-20 flex w-[25px] cursor-col-resize items-center justify-end p-2"
								onMouseDown={(event) => {
									handleResizingPosition({ e: event, position: "right" });
								}}
								onTouchStart={(event) => handleTouchStart(event, "right")}
								style={{ right: 0 }}
							>
								<div className="z-20 h-[70px] w-1 rounded-xl border bg-[rgba(0,0,0,0.65)] opacity-0 transition-all group-hover:opacity-100" />
							</div>
						</>
					)}
				</figure>

				{editingCaption ? (
					<Input
						autoFocus
						className="text-muted-foreground mt-2 text-center text-sm focus:ring-0"
						onBlur={handleCaptionBlur}
						onChange={handleCaptionChange}
						onKeyDown={handleCaptionKeyDown}
						placeholder="Add a caption..."
						value={caption}
					/>
				) : (
					<div
						className="text-muted-foreground mt-2 cursor-text text-center text-sm"
						onClick={() => editor?.isEditable && setEditingCaption(true)}
					>
						{caption || "Add a caption..."}
					</div>
				)}

				{editor?.isEditable && (
					<div
						className={cn(
							"bg-background/80 absolute top-4 right-4 flex items-center gap-1 rounded-md border p-1 opacity-0 backdrop-blur transition-opacity",
							!resizing && "group-hover:opacity-100",
							openedMore && "opacity-100",
						)}
					>
						<Button
							className={cn(
								"size-7",
								node.attrs.align === "left" && "bg-accent",
							)}
							onClick={() => updateAttributes({ align: "left" })}
							size="icon"
							variant="ghost"
						>
							<AlignLeft className="size-4" />
						</Button>
						<Button
							className={cn(
								"size-7",
								node.attrs.align === "center" && "bg-accent",
							)}
							onClick={() => updateAttributes({ align: "center" })}
							size="icon"
							variant="ghost"
						>
							<AlignCenter className="size-4" />
						</Button>
						<Button
							className={cn(
								"size-7",
								node.attrs.align === "right" && "bg-accent",
							)}
							onClick={() => updateAttributes({ align: "right" })}
							size="icon"
							variant="ghost"
						>
							<AlignRight className="size-4" />
						</Button>
						<Separator className="h-[20px]" orientation="vertical" />
						<DropdownMenu onOpenChange={setOpenedMore} open={openedMore}>
							<DropdownMenuTrigger asChild>
								<Button className="size-7" size="icon" variant="ghost">
									<MoreVertical className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								alignOffset={-90}
								className="mt-1 text-sm"
							>
								<DropdownMenuItem onClick={() => setEditingCaption(true)}>
									<Edit className="mr-2 size-4" /> Edit Caption
								</DropdownMenuItem>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>
										<ImageIcon className="mr-2 size-4" /> Replace Image
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="w-fit min-w-52 p-2">
										<div className="space-y-4">
											<div>
												<p className="mb-2 text-xs font-medium">Upload Image</p>
												<input
													accept="image/*"
													className="hidden"
													id="replace-image-upload"
													onChange={handleFileChange}
													ref={fileInputRef}
													type="file"
												/>
												<label
													className="hover:bg-accent flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-4"
													htmlFor="replace-image-upload"
												>
													{uploading ? (
														<>
															<Loader2 className="h-4 w-4 animate-spin" />
															<span>Uploading...</span>
														</>
													) : (
														<>
															<ImageIcon className="h-4 w-4" />
															<span>Choose Image</span>
														</>
													)}
												</label>
												{error && (
													<p className="text-destructive mt-2 text-xs">
														{error}
													</p>
												)}
											</div>

											<div>
												<p className="mb-2 text-xs font-medium">Or use URL</p>
												<div className="space-y-2">
													<Input
														className="text-xs"
														onChange={(e) => setImageUrl(e.target.value)}
														placeholder="Enter image URL..."
														value={imageUrl}
													/>
													<Button
														className="w-full"
														disabled={!imageUrl}
														onClick={handleImageUrlSubmit}
														size="sm"
													>
														Replace with URL
													</Button>
												</div>
											</div>

											<div>
												<p className="mb-2 text-xs font-medium">Alt Text</p>
												<Input
													className="text-xs"
													onChange={(e) => setAltText(e.target.value)}
													placeholder="Alt text (optional)"
													value={altText}
												/>
											</div>
										</div>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
								<DropdownMenuItem
									onClick={() => {
										const aspectRatio = node.attrs.aspectRatio;
										if (aspectRatio) {
											const parentWidth =
												nodeRef.current?.parentElement?.offsetWidth ?? 0;
											updateAttributes({
												width: parentWidth,
												height: parentWidth / aspectRatio,
											});
										}
									}}
								>
									<Maximize className="mr-2 size-4" /> Full Width
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={deleteNode}
								>
									<Trash className="mr-2 size-4" /> Delete Image
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</div>
		</NodeViewWrapper>
	);
}
