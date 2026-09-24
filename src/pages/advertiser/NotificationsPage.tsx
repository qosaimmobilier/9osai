import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTime } from '@/lib/constants';
import { useState } from 'react';

export function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <DashboardLayout role="advertiser">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount} إشعار غير مقروء</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4" />
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200'}`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200'}`}
        >
          غير مقروء ({unreadCount})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-16 w-full"></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-3 ${!n.read ? 'border-r-4 border-r-primary-500' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                n.type === 'property_published' ? 'bg-green-100 text-green-600' :
                n.type === 'property_rejected' ? 'bg-red-100 text-red-600' :
                n.type === 'property_suspended' ? 'bg-orange-100 text-orange-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{n.title}</h3>
                {n.message && <p className="text-sm text-gray-600 mt-1">{n.message}</p>}
                <p className="text-xs text-gray-400 mt-2">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                  title="تعليم كمقروء"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">لا توجد إشعارات</p>
        </div>
      )}
    </DashboardLayout>
  );
}
