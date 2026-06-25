import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardPageHeader from '../components/DashboardPageHeader';
import ExtractRuleManager from '../components/ExtractRuleManager';

const ExtractRulesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DashboardPageHeader
        breadcrumb={t('dashboard.breadcrumbExtractRules')}
        title={t('dashboard.extractRulesTitle')}
        subtitle={t('dashboard.extractRulesSubtitle')}
      />
      <ExtractRuleManager />
    </div>
  );
};

export default ExtractRulesPage;
