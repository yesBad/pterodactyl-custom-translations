import React, { useContext, useEffect, useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import Field from '@/components/elements/Field';
import { Form, Formik, FormikHelpers } from 'formik';
import FormikSwitch from '@/components/elements/FormikSwitch';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import Switch from '@/components/elements/Switch';
import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import lang from '../../../../../lang.json';

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions(actions => actions.schedules.appendSchedule);
    const [ showCheatsheet, setShowCheetsheet ] = useState(false);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:edit');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then(schedule => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch(error => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                name: schedule?.name || '',
                minute: schedule?.cron.minute || '*/5',
                hour: schedule?.cron.hour || '*',
                dayOfMonth: schedule?.cron.dayOfMonth || '*',
                month: schedule?.cron.month || '*',
                dayOfWeek: schedule?.cron.dayOfWeek || '*',
                enabled: schedule?.isActive ?? true,
                onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
            } as Values}
        >
            {({ isSubmitting }) => (
                <Form>
                    <h3 css={tw`text-2xl mb-6`}>{schedule ? lang.schedule_edit : lang.schedule_create_new}</h3>
                    <FlashMessageRender byKey={'schedule:edit'} css={tw`mb-6`}/>
                    <Field
                        name={'name'}
                        label={lang.schedule_name}
                        description={lang.schedule_desc}
                    />
                    <div css={tw`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                        <Field name={'minute'} label={lang.minute}/>
                        <Field name={'hour'} label={lang.hour}/>
                        <Field name={'dayOfMonth'} label={lang.day_of_month}/>
                        <Field name={'month'} label={lang.month}/>
                        <Field name={'dayOfWeek'} label={lang.day_of_week}/>
                    </div>
                    <p css={tw`text-neutral-400 text-xs mt-2`}>
                        {lang.the_schedule_system_stuff_blabla_no_one_fucking_cares}
                    </p>
                    <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                        <Switch
                            name={'show_cheatsheet'}
                            description={'Show the cron cheatsheet for some examples.'}
                            label={'Show Cheatsheet'}
                            defaultChecked={showCheatsheet}
                            onChange={() => setShowCheetsheet(s => !s)}
                        />
                        {showCheatsheet &&
                            <div css={tw`block md:flex w-full`}>
                                <ScheduleCheatsheetCards/>
                            </div>
                        }
                    </div>
                    <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                        <FormikSwitch
                            name={'onlyWhenOnline'}
                            description={lang.schedule_only_excec}
                            label={lang.only_when_server_is_online}
                        />
                    </div>
                    <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                        <FormikSwitch
                            name={'enabled'}
                            description={lang.schedule_will_be_exec_if_enabled}
                            label={lang.sceeeeeedule_enabled}
                        />
                    </div>
                    <div css={tw`mt-6 text-right`}>
                        <Button css={tw`w-full sm:w-auto`} type={'submit'} disabled={isSubmitting}>
                            {schedule ? lang.save_changes : lang.create_schedule}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(EditScheduleModal);
