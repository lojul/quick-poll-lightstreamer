import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { CreatePollData } from '@/types/poll';

interface CreatePollProps {
  onCreatePoll: (pollData: CreatePollData) => void;
}

export function CreatePoll({ onCreatePoll }: CreatePollProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

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

    onCreatePoll({
      question: question.trim(),
      options: validOptions
    });

    // Reset form
    setQuestion('');
    setOptions(['', '']);
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