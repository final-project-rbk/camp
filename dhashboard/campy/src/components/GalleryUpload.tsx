'use client';
import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, MoveUp, MoveDown, Image } from 'lucide-react';
import CloudinaryUpload from './CloudinaryUpload';

interface GalleryStep {
  title: string;
  description: string;
  image: string;
}

interface GalleryUploadProps {
  initialSteps?: GalleryStep[];
  onChange: (steps: GalleryStep[]) => void;
}

export default function GalleryUpload({ initialSteps = [], onChange }: GalleryUploadProps) {
  const [steps, setSteps] = useState<GalleryStep[]>(initialSteps);

  useEffect(() => {
    setSteps(initialSteps || []);
  }, [initialSteps]);

  const addStep = () => {
    const newSteps = [
      ...steps,
      { title: `Step ${steps.length + 1}`, description: '', image: '' }
    ];
    setSteps(newSteps);
    onChange(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    onChange(newSteps);
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
    setSteps(newSteps);
    onChange(newSteps);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
    onChange(newSteps);
  };

  const updateStep = (index: number, field: keyof GalleryStep, value: string) => {
    const newSteps = steps.map((step, i) => {
      if (i === index) {
        return { ...step, [field]: value };
      }
      return step;
    });
    setSteps(newSteps);
    onChange(newSteps);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium" style={{ color: '#CCD6F6' }}>Gallery Steps</h3>
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-1 text-sm px-3 py-1 rounded-md"
          style={{ 
            backgroundColor: 'rgba(100, 255, 218, 0.1)', 
            color: '#64FFDA' 
          }}
        >
          <PlusCircle size={16} />
          <span>Add Step</span>
        </button>
      </div>

      {steps.length === 0 ? (
        <div 
          className="p-6 text-center rounded-md"
          style={{ 
            backgroundColor: 'rgba(17, 34, 64, 0.6)', 
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: '#8892B0'
          }}
        >
          <Image size={24} className="mx-auto mb-2 opacity-50" />
          <p>No gallery steps added yet</p>
          <button
            type="button"
            onClick={addStep}
            className="mt-2 text-sm px-3 py-1 rounded-md"
            style={{ 
              backgroundColor: 'rgba(100, 255, 218, 0.1)', 
              color: '#64FFDA' 
            }}
          >
            Add your first step
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="p-4 rounded-md"
              style={{ 
                backgroundColor: 'rgba(17, 34, 64, 0.6)', 
                borderColor: 'rgba(255, 255, 255, 0.1)' 
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <h4 style={{ color: '#CCD6F6' }}>Step {index + 1}</h4>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveStepUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded-md ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                  >
                    <MoveUp size={16} style={{ color: '#8892B0' }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStepDown(index)}
                    disabled={index === steps.length - 1}
                    className={`p-1 rounded-md ${index === steps.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                  >
                    <MoveDown size={16} style={{ color: '#8892B0' }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="p-1 rounded-md hover:bg-gray-700"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#CCD6F6',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                      Description
                    </label>
                    <textarea
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#CCD6F6',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                    Image
                  </label>
                  <CloudinaryUpload
                    onImageUpload={(url) => updateStep(index, 'image', url)}
                    currentImage={step.image}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 