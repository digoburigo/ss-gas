import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";

interface ContractOption {
  id: string;
  name: string;
  qdcContracted: number;
}

interface ContractSelectorProps {
  contracts: ContractOption[];
  value: string;
  onChange: (contractId: string) => void;
  label?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
}

export function ContractSelector({
  contracts,
  value,
  onChange,
  label = "Contrato",
  showAllOption = false,
  allOptionLabel = "Todos os contratos",
  className,
}: ContractSelectorProps) {
  if (contracts.length <= 1) return null;

  return (
    <div className={className}>
      <Label htmlFor="contract-selector" className="text-sm font-medium">
        {label}
      </Label>
      <NativeSelect
        id="contract-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      >
        {showAllOption && (
          <NativeSelectOption value="">{allOptionLabel}</NativeSelectOption>
        )}
        {contracts.map((contract) => (
          <NativeSelectOption key={contract.id} value={contract.id}>
            {contract.name} (QDC:{" "}
            {contract.qdcContracted.toLocaleString("pt-BR")})
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
