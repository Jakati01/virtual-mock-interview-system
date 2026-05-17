import React from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '../components/layout';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../store';

const ArenaLobby = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const rounds = [
    { id: 1, name: 'MCQ Round', icon: '📝', color: 'blue', path: '/practice/mcq' },
    { id: 2, name: 'Theory Round', icon: '📚', color: 'purple', path: '/practice/theory' },
    { id: 3, name: 'Communication', icon: '💬', color: 'green', path: '/practice/communication' },
    { id: 4, name: 'Coding Round', icon: '💻', color: 'orange', path: '/practice/coding' },
  ];

  return (
    <MainLayout user={user} onLogout={logout}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <h1 className="text-4xl font-bold text-white">Practice Arena</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rounds.map((round) => (
            <Card key={round.id} className="cursor-pointer hover:border-white/30 transition-all">
              <div className="text-5xl mb-4">{round.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{round.name}</h3>
              <Button variant="primary" className="w-full mt-4">Start</Button>
            </Card>
          ))}
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default ArenaLobby;
