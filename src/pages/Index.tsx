
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import TextEditor from '@/components/TextEditor';

const Index = () => {
  return (
    <Provider store={store}>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Text Editor with Tagging</h1>
        <div className="bg-gray-50 rounded-lg p-4 shadow-md">
          <TextEditor />
        </div>
      </div>
    </Provider>
  );
};

export default Index;
