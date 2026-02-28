import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock, Coins } from 'lucide-react';
import { CreatePollData } from '@/types/poll';
import { POLL_COST } from '@/hooks/useCredits';

interface CreatePollProps {
  onCreatePoll: (pollData: CreatePollData) => void;
  hasEnoughCredits?: boolean;
  credits?: number | null;
}

const DEADLINE_OPTIONS = [
  { value: '1', label: '1 天' },
  { value: '3', label: '3 天（預設）' },
  { value: '7', label: '7 天' },
  { value: '14', label: '14 天' },
  { value: '30', label: '30 天' },
];

const MAX_TEXT_LENGTH = 45;
const MAX_NUMBER_LENGTH = 16;

export function CreatePoll({ onCreatePoll, hasEnoughCredits = true, credits }: CreatePollProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [deadlineDays, setDeadlineDays] = useState('3');

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  // Limit input based on content type
  const limitInput = (value: string): string => {
    // Check if input is purely numeric
    if (/^\d+$/.test(value)) {
      return value.slice(0, MAX_NUMBER_LENGTH);
    }
    return value.slice(0, MAX_TEXT_LENGTH);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = limitInput(value);
    setOptions(newOptions);
  };

  const updateQuestion = (value: string) => {
    setQuestion(limitInput(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) return;

    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) return;

    // Calculate deadline based on selected days
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(deadlineDays));

    onCreatePoll({
      question: question.trim(),
      options: validOptions,
      deadline
    });

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setDeadlineDays('3');
  };

  const isValid = question.trim() && options.filter(option => option.trim()).length >= 2 && hasEnoughCredits;

  return (
    <Card className="p-6 bg-poll-card border-poll-card-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          建立新投票
        </h2>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5" />
          費用: {POLL_COST} 貓爪幣
        </Badge>
      </div>

      {!hasEnoughCredits && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-700 text-sm">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            <span>
              貓爪幣不足。您目前有 {credits ?? 0} 貓爪幣，需要 {POLL_COST} 貓爪幣才能建立投票。
            </span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="question" className="text-lg font-medium">
              投票問題
            </Label>
            <span className={`text-xs ${question.length >= MAX_TEXT_LENGTH ? 'text-red-500' : 'text-muted-foreground'}`}>
              {question.length}/{MAX_TEXT_LENGTH}
            </span>
          </div>
          <Input
            id="question"
            value={question}
            onChange={(e) => updateQuestion(e.target.value)}
            placeholder="您想問什麼問題？"
            maxLength={MAX_TEXT_LENGTH}
            className="bg-poll-option border-poll-card-border focus:border-primary text-lg py-3"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-medium">答案選項</Label>
            <span className="text-xs text-muted-foreground">
              最多 {MAX_TEXT_LENGTH} 字
            </span>
          </div>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`選項 ${index + 1}`}
                  maxLength={MAX_TEXT_LENGTH}
                  className="bg-poll-option border-poll-card-border focus:border-primary pr-12"
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${option.length >= MAX_TEXT_LENGTH ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {option.length}/{MAX_TEXT_LENGTH}
                </span>
              </div>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeOption(index)}
                  className="border-poll-card-border hover:bg-destructive hover:border-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full border-poll-card-border hover:bg-poll-option-hover border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增選項
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            投票期限
          </Label>
          <Select value={deadlineDays} onValueChange={setDeadlineDays}>
            <SelectTrigger className="bg-poll-option border-poll-card-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEADLINE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            投票將在 {deadlineDays} 天後截止
          </p>
        </div>

        <Button
          type="submit"
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-3 text-lg"
        >
          建立投票
        </Button>
      </form>
    </Card>
  );
}