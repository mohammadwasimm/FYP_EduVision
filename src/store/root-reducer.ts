import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import studentsReducer from '../pages/students/stores/reducers';
import reportsReducer from '../pages/reports/stores/reducers';
import authReducer from '../pages/auth/stores/reducers';

// Persist configs
const studentsPersistConfig = {
  key: 'students',
  storage,
  whitelist: ['selectedStudent'], // Only persist selected student
};

const rootReducer = combineReducers({
  students: persistReducer(studentsPersistConfig, studentsReducer),
  reports: reportsReducer,
  auth: authReducer,
});

export default rootReducer;
