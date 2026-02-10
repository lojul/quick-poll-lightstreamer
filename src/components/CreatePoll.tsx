import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock } from 'lucide-react';
import { CreatePollData } from '@/types/poll';

interface CreatePollProps {
  onCreatePoll: (pollData: CreatePollData) => void;
}

const DEADLINE_OPTIONS = [
  { value: '1', label: '1 天' },
  { value: '3', label: '3 天（預設）' },
  { value: '7', label: '7 天' },
  { value: '14', label: '14 天' },
  { value: '30', label: '30 天' },
];

export function CreatePoll({ onCreatePoll }: CreatePollProps) {
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

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
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

  const isValid = question.trim() && options.filter(option => option.trim()).length >= 2;

  return (
    <Card className="p-6 bg-poll-card border-poll-card-border">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
        建立新投票
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="question" className="text-lg font-medium">
            投票問題
          </Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="您想問什麼問題？"
            className="bg-poll-option border-poll-card-border focus:border-primary text-lg py-3"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-medium">答案選項</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`選項 ${index + 1}`}
                className="bg-poll-option border-poll-card-border focus:border-primary"
              />
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