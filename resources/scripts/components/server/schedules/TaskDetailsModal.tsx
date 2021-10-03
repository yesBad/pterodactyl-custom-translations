import React, { useContext, useEffect } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { Field as FormikField, Form, Formik, FormikHelpers, useField } from 'formik';
import { ServerContext } from '@/state/server';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import { boolean, number, object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Select from '@/components/elements/Select';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import FormikSwitch from '@/components/elements/FormikSwitch';
import lang from '../../../../../lang.json';

interface Props {
    schedule: Schedule;
    // If a task is provided we can assume we're editing it. If not provided,
    // we are creating a new one.
    task?: Task;
}

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
    continueOnFailure: boolean;
}

const schema = object().shape({
    action: string().required().oneOf([ 'command', 'power', 'backup' ]),
    payload: string().when('action', {
        is: v => v !== 'backup',
        then: string().required('A task payload must be provided.'),
        otherwise: string(),
    }),
    continueOnFailure: boolean(),
    timeOffset: number().typeError('The time offset must be a valid number between 0 and 900.')
        .required('A time offset value must be provided.')
        .min(0, 'The time offset must be at least 0 seconds.')
        .max(900, 'The time offset must be less than 900 seconds.'),
});

const ActionListener = () => {
    const [ { value }, { initialValue: initialAction } ] = useField<string>('action');
    const [ , { initialValue: initialPayload }, { setValue, setTouched } ] = useField<string>('payload');

    useEffect(() => {
        if (value !== initialAction) {
            setValue(value === 'power' ? 'start' : '');
            setTouched(false);
        } else {
            setValue(initialPayload || '');
            setTouched(false);
        }
    }, [ value ]);

    return null;
};

const TaskDetailsModal = ({ schedule, task }: Props) => {
    const { dismiss } = useContext(ModalContext);
    const { clearFlashes, addError } = useFlash();

    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions(actions => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState(state => state.server.data!.featureLimits.backups);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:task');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({ message: 'A backup task cannot be created when the server\'s backup limit is set to 0.', key: 'schedule:task' });
        } else {
            createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
                .then(task => {
                    let tasks = schedule.tasks.map(t => t.id === task.id ? task : t);
                    if (!schedule.tasks.find(t => t.id === task.id)) {
                        tasks = [ ...tasks, task ];
                    }

                    appendSchedule({ ...schedule, tasks });
                    dismiss();
                })
                .catch(error => {
                    console.error(error);
                    setSubmitting(false);
                    addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
                });
        }
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{
                action: task?.action || 'command',
                payload: task?.payload || '',
                timeOffset: task?.timeOffset.toString() || '0',
                continueOnFailure: task?.continueOnFailure || false,
            }}
        >
            {({ isSubmitting, values }) => (
                <Form css={tw`m-0`}>
                    <FlashMessageRender byKey={'schedule:task'} css={tw`mb-4`}/>
                    <h2 css={tw`text-2xl mb-6`}>{task ? lang.edit_task : lang.create_task}</h2>
                    <div css={tw`flex`}>
                        <div css={tw`mr-2 w-1/3`}>
                            <Label>{lang.action}</Label>
                            <ActionListener/>
                            <FormikFieldWrapper name={'action'}>
                                <FormikField as={Select} name={'action'}>
                                    <option value={'command'}>{lang.send_command}</option>
                                    <option value={'power'}>{lang.send_power_action}</option>
                                    <option value={'backup'}>{lang.create_backup}</option>
                                </FormikField>
                            </FormikFieldWrapper>
                        </div>
                        <div css={tw`flex-1 ml-6`}>
                            <Field
                                name={'timeOffset'}
                                label={lang.time_offset}
                                description={lang.time_offset_desc}
                            />
                        </div>
                    </div>
                    <div css={tw`mt-6`}>
                        {values.action === 'command' ?
                            <div>
                                <Label>{lang.payload}</Label>
                                <FormikFieldWrapper name={'payload'}>
                                    <FormikField as={Textarea} name={'payload'} rows={6}/>
                                </FormikFieldWrapper>
                            </div>
                            :
                            values.action === 'power' ?
                                <div>
                                    <Label>{lang.payload}</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField as={Select} name={'payload'}>
                                            <option value={'start'}>{lang.start_the_server}</option>
                                            <option value={'restart'}>{lang.restart_the_server}</option>
                                            <option value={'stop'}>{lang.stop_the_server}</option>
                                            <option value={'kill'}>{lang.terminate_the_server}</option>
                                        </FormikField>
                                    </FormikFieldWrapper>
                                </div>
                                :
                                <div>
                                    <Label>{lang.ignored_files}</Label>
                                    <FormikFieldWrapper
                                        name={'payload'}
                                        description={lang.optional_backup_schedule_desc_thing}
                                    >
                                        <FormikField as={Textarea} name={'payload'} rows={6}/>
                                    </FormikFieldWrapper>
                                </div>
                        }
                    </div>
                    <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                        <FormikSwitch
                            name={'continueOnFailure'}
                            description={lang.future_tasks_will_run}
                            label={lang.continue_on_failure}
                        />
                    </div>
                    <div css={tw`flex justify-end mt-6`}>
                        <Button type={'submit'} disabled={isSubmitting}>
                            {task ? lang.save_changes : lang.create_task}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(TaskDetailsModal);
