import { useUploadFiles } from "@better-upload/client";
import { useMutation } from "@tanstack/react-query";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { AlertTriangle, FileText, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";

import type { GasContract } from "@acme/zen-v3/zenstack/models";
import { Button } from "@acme/ui/button";
import { Label } from "@acme/ui/label";
import { ScrollArea } from "@acme/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { api } from "~/clients/api-client";
import { authClient } from "~/clients/auth-client";
import { cn } from "@acme/ui";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { ContractExtractionForm } from "./contract-extraction-form";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ContractUploadDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type ExtractedField = {
	value: string | number | boolean | null;
	confidence: number;
	source?: string;
};

type ExtractedContractData = {
	[key: string]: ExtractedField;
};

type UploadedFile = {
	file: File;
	preview: string;
	type: "pdf" | "image";
};

export function ContractUploadDrawer({
	open,
	onOpenChange,
}: ContractUploadDrawerProps) {
	const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
	const [extractedData, setExtractedData] =
		useState<ExtractedContractData | null>(null);
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractionError, setExtractionError] = useState<string | null>(null);
	const [numPages, setNumPages] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);

	const client = useClientQueries(schema);
	const { data: session } = authClient.useSession();

	const { control } = useUploadFiles({
		route: "contracts",
		api: `${import.meta.env.PUBLIC_SERVER_URL}/api/upload`,
		credentials: "include",
	});

	const { mutate: createContract, isPending: isCreating } =
		client.gasContract.useCreate({
			onSuccess: () => {
				toast.success("Contrato criado com sucesso");
				handleReset();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	// Mutation for audit log
	const { mutateAsync: createAuditLog } =
		client.gasContractAuditLog.useCreate();

	// Mutation for updating unit contract linkage
	const { mutateAsync: updateUnit } = client.gasUnit.useUpdate();

	const extractContractData = useMutation({
		mutationFn: async (file: File) => {
			const base64 = await fileToBase64(file);
			const response = await api["contract-extraction"].extract.post({
				fileBase64: base64,
				fileType: file.type,
				fileName: file.name,
			});

			if (response.error) {
				throw new Error(
					typeof response.error.value === "object" &&
					response.error.value !== null &&
					"error" in response.error.value
						? (response.error.value as { error: string }).error
						: "Unknown error",
				);
			}

			return response.data;
		},
	});

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const result = reader.result as string;
				const base64 = result.split(",")[1];
				resolve(base64 ?? "");
			};
			reader.onerror = reject;
		});
	};

	const handleFileSelect = useCallback(
		async (files: FileList | null) => {
			if (!files || files.length === 0) return;

			const file = files[0];
			if (!file) return;

			const isImage = file.type.startsWith("image/");
			const isPdf = file.type === "application/pdf";

			if (!isImage && !isPdf) {
				toast.error("Arquivo inválido. Selecione um PDF ou imagem.");
				return;
			}

			const preview = URL.createObjectURL(file);
			setUploadedFile({
				file,
				preview,
				type: isPdf ? "pdf" : "image",
			});
			setExtractedData(null);
			setExtractionError(null);
			setCurrentPage(1);

			// Start extraction automatically
			setIsExtracting(true);
			try {
				const result = await extractContractData.mutateAsync(file);
				setExtractedData(result.extractedData as ExtractedContractData);
			} catch (error) {
				setExtractionError(
					error instanceof Error ? error.message : "Erro ao extrair dados",
				);
				toast.error("Erro ao extrair dados do contrato");
			} finally {
				setIsExtracting(false);
			}
		},
		[extractContractData],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			handleFileSelect(e.dataTransfer.files);
		},
		[handleFileSelect],
	);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const handleReset = () => {
		if (uploadedFile?.preview) {
			URL.revokeObjectURL(uploadedFile.preview);
		}
		setUploadedFile(null);
		setExtractedData(null);
		setExtractionError(null);
		setNumPages(0);
		setCurrentPage(1);
	};

	const handleSubmit = async (data: {
		name: string;
		contractNumber: string;
		supplier: string;
		supplierCnpj: string;
		qdcContracted: number;
		volumeUnit: string;
		transportToleranceUpperPercent: number;
		transportToleranceLowerPercent: number;
		moleculeTolerancePercent: number;
		takeOrPayPercent: number | null;
		takeOrPayAccumulationMonths: number | null;
		takeOrPayExpirationMonths: number | null;
		makeUpGasEnabled: boolean;
		makeUpGasExpirationMonths: number | null;
		makeUpGasMaxPercent: number | null;
		flexibilityUpPercent: number | null;
		flexibilityDownPercent: number | null;
		seasonalFlexibility: boolean;
		basePricePerUnit: number | null;
		priceCurrency: string;
		adjustmentIndex: string;
		adjustmentFrequency: string;
		adjustmentBaseDate: string;
		nextAdjustmentDate: string;
		transportCostPerUnit: number | null;
		taxesIncluded: boolean;
		penaltyForUnderConsumption: number | null;
		penaltyForOverConsumption: number | null;
		penaltyCalculationMethod: string;
		latePaymentPenaltyPercent: number | null;
		latePaymentInterestPercent: number | null;
		effectiveFrom: string;
		effectiveTo: string;
		renewalDate: string;
		renewalNoticeDays: number | null;
		dailySchedulingDeadline: string;
		monthlyDeclarationDeadline: number | null;
		active: boolean;
		notes: string;
		unitIds: string[];
	}) => {
		const payload = {
			name: data.name,
			contractNumber: data.contractNumber || null,
			supplier: data.supplier || null,
			supplierCnpj: data.supplierCnpj || null,
			qdcContracted: data.qdcContracted,
			volumeUnit: data.volumeUnit,
			transportToleranceUpperPercent: data.transportToleranceUpperPercent,
			transportToleranceLowerPercent: data.transportToleranceLowerPercent,
			moleculeTolerancePercent: data.moleculeTolerancePercent,
			takeOrPayPercent: data.takeOrPayPercent,
			takeOrPayAccumulationMonths: data.takeOrPayAccumulationMonths,
			takeOrPayExpirationMonths: data.takeOrPayExpirationMonths,
			makeUpGasEnabled: data.makeUpGasEnabled,
			makeUpGasExpirationMonths: data.makeUpGasExpirationMonths,
			makeUpGasMaxPercent: data.makeUpGasMaxPercent,
			flexibilityUpPercent: data.flexibilityUpPercent,
			flexibilityDownPercent: data.flexibilityDownPercent,
			seasonalFlexibility: data.seasonalFlexibility,
			basePricePerUnit: data.basePricePerUnit,
			priceCurrency: data.priceCurrency,
			adjustmentIndex: data.adjustmentIndex || null,
			adjustmentFrequency: data.adjustmentFrequency || null,
			adjustmentBaseDate: data.adjustmentBaseDate
				? new Date(data.adjustmentBaseDate)
				: null,
			nextAdjustmentDate: data.nextAdjustmentDate
				? new Date(data.nextAdjustmentDate)
				: null,
			transportCostPerUnit: data.transportCostPerUnit,
			taxesIncluded: data.taxesIncluded,
			penaltyForUnderConsumption: data.penaltyForUnderConsumption,
			penaltyForOverConsumption: data.penaltyForOverConsumption,
			penaltyCalculationMethod: data.penaltyCalculationMethod || null,
			latePaymentPenaltyPercent: data.latePaymentPenaltyPercent,
			latePaymentInterestPercent: data.latePaymentInterestPercent,
			effectiveFrom: new Date(data.effectiveFrom),
			effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
			renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
			renewalNoticeDays: data.renewalNoticeDays,
			dailySchedulingDeadline: data.dailySchedulingDeadline || null,
			monthlyDeclarationDeadline: data.monthlyDeclarationDeadline,
			active: data.active,
			notes: data.notes || null,
		};

		createContract(
			{
				data: payload,
			},
			{
				onSuccess: async (createdContract) => {
					// Create audit log entry for creation
					await createAuditLog({
						data: {
							contractId: createdContract.id,
							action: "create",
							field: "ai_extraction",
							oldValue: null,
							newValue: JSON.stringify({
								...payload,
								extractionSource: uploadedFile?.file.name,
							}),
							userId: session?.user?.id || null,
							userName: session?.user?.name || null,
						},
					});

					// Link units to the new contract
					for (const unitId of data.unitIds) {
						await updateUnit({
							where: { id: unitId },
							data: { contractId: createdContract.id },
						});
					}
				},
			},
		);
	};

	const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
		setNumPages(numPages);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col overflow-hidden p-0 sm:max-w-[95vw] lg:max-w-[90vw]">
				<SheetHeader className="border-b px-6 py-4">
					<SheetTitle>Upload de Contrato com Extração IA</SheetTitle>
					<SheetDescription>
						Faça upload de um contrato em PDF ou imagem para extrair
						automaticamente os dados. Revise e confirme antes de salvar.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 overflow-hidden">
					{/* Left side - Document viewer */}
					<div className="flex w-1/2 flex-col border-r">
						<div className="border-b bg-muted/30 px-4 py-2">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">
									Documento Original
								</Label>
								{uploadedFile && (
									<Button
										variant="ghost"
										size="sm"
										onClick={handleReset}
										className="h-7 px-2"
									>
										<X className="mr-1 h-4 w-4" />
										Remover
									</Button>
								)}
							</div>
						</div>

						<div className="flex-1 overflow-hidden">
							{!uploadedFile ? (
								<div
									className="flex h-full flex-col items-center justify-center p-8"
									onDrop={handleDrop}
									onDragOver={handleDragOver}
								>
									<div className="border-input hover:border-primary/50 hover:bg-accent/50 flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors">
										<input
											type="file"
											accept=".pdf,image/*"
											onChange={(e) => handleFileSelect(e.target.files)}
											className="hidden"
											id="contract-upload"
										/>
										<label
											htmlFor="contract-upload"
											className="flex cursor-pointer flex-col items-center"
										>
											<Upload className="text-muted-foreground mb-4 h-12 w-12" />
											<p className="mb-2 text-center font-medium">
												Arraste e solte o contrato aqui
											</p>
											<p className="text-muted-foreground text-center text-sm">
												ou clique para selecionar
											</p>
											<p className="text-muted-foreground mt-2 text-center text-xs">
												Formatos aceitos: PDF, JPEG, PNG (máx. 20MB)
											</p>
										</label>
									</div>
								</div>
							) : (
								<ScrollArea className="h-full">
									<div className="flex flex-col items-center p-4">
										{uploadedFile.type === "pdf" ? (
											<>
												<Document
													file={uploadedFile.preview}
													onLoadSuccess={onDocumentLoadSuccess}
													loading={
														<div className="flex items-center justify-center py-8">
															<Loader2 className="h-8 w-8 animate-spin" />
														</div>
													}
												>
													<Page
														pageNumber={currentPage}
														width={500}
														renderTextLayer={true}
														renderAnnotationLayer={true}
													/>
												</Document>
												{numPages > 1 && (
													<div className="mt-4 flex items-center gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																setCurrentPage((p) => Math.max(1, p - 1))
															}
															disabled={currentPage <= 1}
														>
															Anterior
														</Button>
														<span className="text-muted-foreground text-sm">
															Página {currentPage} de {numPages}
														</span>
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																setCurrentPage((p) => Math.min(numPages, p + 1))
															}
															disabled={currentPage >= numPages}
														>
															Próxima
														</Button>
													</div>
												)}
											</>
										) : (
											<img
												src={uploadedFile.preview}
												alt="Contract preview"
												className="max-h-[calc(100vh-200px)] max-w-full rounded-lg object-contain"
											/>
										)}
									</div>
								</ScrollArea>
							)}
						</div>
					</div>

					{/* Right side - Extracted data form */}
					<div className="flex w-1/2 flex-col">
						<div className="border-b bg-muted/30 px-4 py-2">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">Dados Extraídos</Label>
								{extractedData && (
									<div className="flex items-center gap-2">
										<span className="bg-yellow-100 dark:bg-yellow-900/30 flex items-center gap-1 rounded px-2 py-0.5 text-xs">
											<AlertTriangle className="h-3 w-3 text-yellow-600" />
											<span className="text-yellow-700 dark:text-yellow-400">
												Campos em amarelo requerem revisão
											</span>
										</span>
									</div>
								)}
							</div>
						</div>

						<ScrollArea className="flex-1">
							<div className="p-4">
								{!uploadedFile ? (
									<div className="text-muted-foreground flex h-64 flex-col items-center justify-center text-center">
										<FileText className="mb-4 h-12 w-12 opacity-50" />
										<p>Faça upload de um contrato para extrair os dados</p>
									</div>
								) : isExtracting ? (
									<div className="flex h-64 flex-col items-center justify-center">
										<Loader2 className="mb-4 h-8 w-8 animate-spin" />
										<p className="text-muted-foreground">
											Extraindo dados do contrato com IA...
										</p>
										<p className="text-muted-foreground mt-1 text-sm">
											Isso pode levar alguns segundos
										</p>
									</div>
								) : extractionError ? (
									<div className="flex h-64 flex-col items-center justify-center text-center">
										<AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
										<p className="font-medium text-red-600">
											Erro na extração
										</p>
										<p className="text-muted-foreground mt-1 text-sm">
											{extractionError}
										</p>
										<Button
											variant="outline"
											className="mt-4"
											onClick={() => {
												if (uploadedFile?.file) {
													handleFileSelect(
														new DataTransfer().files.length > 0
															? new DataTransfer().files
															: null,
													);
												}
											}}
										>
											Tentar novamente
										</Button>
									</div>
								) : extractedData ? (
									<ContractExtractionForm
										extractedData={extractedData}
										onSubmit={handleSubmit}
										isSubmitting={isCreating}
									/>
								) : null}
							</div>
						</ScrollArea>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
